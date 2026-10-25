'use client';

import { useCallback, useEffect, useRef } from 'react';

import { HaaDetector } from '@/components/HaaDetector/HaaDetector';
import { SettingsMenu } from '@/components/SettingsMenu/SettingsMenu';
import { TemperatureSlider } from '@/components/ui/TemperatureSlider';
import { CONFIG } from '@/config';
import { useCurrentCoordinates } from '@/hooks/useCurrentCoordinates';
import { useDrawing } from '@/hooks/useDrawing';
import { useFogCanvas } from '@/hooks/useFogCanvas';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useWeather } from '@/hooks/useWeather';
import { useWaterDrips } from '@/hooks/useWaterDrips';
import { useWindowInput } from '@/hooks/useWindowInput';
import { toLocalPoints, toNormalizedPoints } from '@/lib/normalizePoints';
import { startStrokeReplay } from '@/lib/replay';
import { WEATHER_KIND_CODES } from '@/lib/weatherKind';
import { useAppStore } from '@/stores/useAppStore';
import type { Point } from '@/types';

import { DrawingLayer } from './DrawingLayer';
import { FogLayer } from './FogLayer';
import { WeatherOverlay } from './WeatherOverlay';
import { WindowFrame } from './WindowFrame';
import styles from './WindowScene.module.css';

/** 接続状態の表示文言 */
const SYNC_STATUS_TEXT = {
  disconnected: '同期していません',
  connecting: '同期に接続しています…',
  connected: '同期中（相手と共有）',
  error: '同期に失敗しました',
} as const;

/**
 * 窓の全体。画面いっぱいに広がり、レイヤーは下から「天気・手書き・曇り」の順に重ねる。
 * 入力はガラス部分で一括して受ける。
 * なぞると曇りが拭ける。手書きのインクは透明で、見えるのは拭き取りの跡だけ。
 * 相手の筆跡と息も、同じ窓に反映する（同期は環境変数が設定されているときだけ）。
 */
export function WindowScene() {
  const roomTemperatureC = useAppStore((state) => state.roomTemperatureC);
  const setRoomTemperatureC = useAppStore((state) => state.setRoomTemperatureC);
  const connectionStatus = useAppStore((state) => state.connectionStatus);
  const weatherOverride = useAppStore((state) => state.weatherOverride);

  const fog = useFogCanvas();
  const drawing = useDrawing();
  const { fadeIn, fadeOut, wipe } = fog;
  const { clear } = drawing;

  const coordinates = useCurrentCoordinates();
  const { weather } = useWeather(coordinates);
  // デモ用に選んだ気象情報があれば、実際の天気より優先する
  const weatherCode =
    weatherOverride === 'actual' ? weather?.weatherCode : WEATHER_KIND_CODES[weatherOverride];

  // 水滴は曇りが濃い間だけ垂れる。操作ではないので、再曇りの待ち時間は動かさない
  // 窓の大きさ（端末ごとに違うため、送る点は割合にする）
  const getGlassSize = () => ({
    width: fog.canvasRef.current?.clientWidth ?? 0,
    height: fog.canvasRef.current?.clientHeight ?? 0,
  });
  // 落ち切った水滴は、相手にも筆跡と同じ形で送る（送信は下の useSupabaseSync の後で結ぶ）
  const sendDropRef = useRef<(path: Point[]) => void>(() => {});
  const drips = useWaterDrips(wipe, getGlassSize, (path) => sendDropRef.current(path));

  // 息を検出したら、手書きを消して、少しの時間をかけて曇らせる。
  // 曇りきったら、そこから 1 分かけて徐々に透明に戻す。その間は水滴も垂れる
  const handleBreath = useCallback(() => {
    clear();
    fadeIn(CONFIG.BREATH_FOG_FADE_MS, () => fadeOut(CONFIG.BREATH_FOG_FADE_OUT_MS));
    drips.start(CONFIG.DRIP_ACTIVE_MS);
  }, [clear, fadeIn, fadeOut, drips]);

  // 相手の再生中の画を、止める時に備えて覚えておく
  const replaysRef = useRef(new Set<() => void>());
  useEffect(() => {
    const replays = replaysRef.current;
    return () => {
      for (const cancel of replays) {
        cancel();
      }
      replays.clear();
    };
  }, []);

  // 相手の筆跡は、書いた時間（t）に沿って再生しながら拭く
  const handleRemoteStroke = useCallback(
    (points: Point[]) => {
      const canvas = fog.canvasRef.current;
      const localPoints = toLocalPoints(
        points,
        canvas?.clientWidth ?? 0,
        canvas?.clientHeight ?? 0,
      );
      const replays = replaysRef.current;
      const cancel = startStrokeReplay(
        localPoints,
        (from, to) => wipe(from, to),
        () => replays.delete(cancel),
      );
      replays.add(cancel);
    },
    [fog.canvasRef, wipe],
  );

  const { sendStroke, sendFog } = useSupabaseSync({
    onRemoteStroke: handleRemoteStroke,
    onRemoteFog: handleBreath,
  });

  useEffect(() => {
    sendDropRef.current = (path) => {
      const width = fog.canvasRef.current?.clientWidth ?? 0;
      const height = fog.canvasRef.current?.clientHeight ?? 0;
      sendStroke(toNormalizedPoints(path, width, height));
    };
  }, [sendStroke, fog.canvasRef]);

  // 自分が今描いている 1 画の点（相手に送るため）
  const strokePointsRef = useRef<Point[]>([]);

  // 1 画の始まりからの時間を各点に付ける（拭く速さと、相手の再生に使う）
  const strokeStartRef = useRef(0);

  const inputHandlers = useWindowInput({
    onInputStart: (point, pointerType) => {
      strokeStartRef.current = performance.now();
      const timed = { ...point, t: 0 };
      strokePointsRef.current = [timed];
      wipe(null, timed);
      drips.markDrawn(timed);
      drawing.beginStroke(point, pointerType !== 'pen');
    },
    onInputMove: (_from, to) => {
      const previous = strokePointsRef.current[strokePointsRef.current.length - 1];
      const timed = { ...to, t: performance.now() - strokeStartRef.current };
      strokePointsRef.current.push(timed);
      wipe(previous, timed);
      drips.markDrawn(timed);
      drawing.extendStroke(to);
    },
    onInputEnd: () => {
      drawing.endStroke();
      if (strokePointsRef.current.length > 0) {
        const { width, height } = getGlassSize();
        sendStroke(toNormalizedPoints(strokePointsRef.current, width, height));
      }
      strokePointsRef.current = [];
    },
  });

  // 自分の息は、ローカルで曇らせると同時に、相手にも送る
  const handleBreathDetected = useCallback(() => {
    handleBreath();
    sendFog();
  }, [handleBreath, sendFog]);

  return (
    <div className={styles.scene}>
      <div className={styles.settings}>
        <SettingsMenu />
      </div>
      <WindowFrame glassProps={inputHandlers}>
        {weatherCode !== undefined && (
          <WeatherOverlay
            weatherCode={weatherCode}
            sunrise={weather?.sunrise}
            sunset={weather?.sunset}
          />
        )}
        <DrawingLayer canvasRef={drawing.canvasRef} />
        <FogLayer canvasRef={fog.canvasRef} />
      </WindowFrame>
      <div className={styles.controls}>
        <TemperatureSlider value={roomTemperatureC} onChange={setRoomTemperatureC} />
        <HaaDetector onDetect={handleBreathDetected} />
        <p className={styles.sync}>{SYNC_STATUS_TEXT[connectionStatus]}</p>
      </div>
    </div>
  );
}
