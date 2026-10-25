'use client';

import { useCallback, useRef } from 'react';

import { HaaDetector } from '@/components/HaaDetector/HaaDetector';
import { SettingsMenu } from '@/components/SettingsMenu/SettingsMenu';
import { TemperatureSlider } from '@/components/ui/TemperatureSlider';
import { CONFIG } from '@/config';
import { useCurrentCoordinates } from '@/hooks/useCurrentCoordinates';
import { useDrawing } from '@/hooks/useDrawing';
import { useFogCanvas } from '@/hooks/useFogCanvas';
import { useFogRecovery } from '@/hooks/useFogRecovery';
import { useSupabaseSync } from '@/hooks/useSupabaseSync';
import { useWeather } from '@/hooks/useWeather';
import { useWindowInput } from '@/hooks/useWindowInput';
import { toLocalPoints, toNormalizedPoints } from '@/lib/normalizePoints';
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
 * 窓の全体。画面いっぱいに広がり、レイヤーは下から「手書き・曇り・天気」の順に重ねる。
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
  const { fillFog, fadeIn, fadeOut, wipe } = fog;
  const { clear } = drawing;

  const coordinates = useCurrentCoordinates();
  const { weather } = useWeather(coordinates);
  // デモ用に選んだ気象情報があれば、実際の天気より優先する
  const weatherCode =
    weatherOverride === 'actual' ? weather?.weatherCode : WEATHER_KIND_CODES[weatherOverride];

  // 操作が止まってから FOG_RECOVER_MS 経つと、曇りが戻って文字が消える
  const handleRecover = useCallback(() => {
    fillFog();
    clear();
  }, [fillFog, clear]);
  const notifyActivity = useFogRecovery(handleRecover);

  // 息を検出したら、手書きを消して、少しの時間をかけて曇らせる。
  // 曇りきったら、そこから 1 分かけて徐々に透明に戻す
  const handleBreath = useCallback(() => {
    clear();
    fadeIn(CONFIG.BREATH_FOG_FADE_MS, () => fadeOut(CONFIG.BREATH_FOG_FADE_OUT_MS));
  }, [clear, fadeIn, fadeOut]);

  // 相手の筆跡は、指でなぞったのと同じように拭く
  const handleRemoteStroke = useCallback(
    (points: Point[]) => {
      const canvas = fog.canvasRef.current;
      const localPoints = toLocalPoints(
        points,
        canvas?.clientWidth ?? 0,
        canvas?.clientHeight ?? 0,
      );
      let previous: Point | null = null;
      for (const point of localPoints) {
        wipe(previous, point);
        previous = point;
      }
      notifyActivity();
    },
    [fog.canvasRef, wipe, notifyActivity],
  );

  // 窓の大きさ（端末ごとに違うため、送る点は割合にする）
  const glassSize = () => ({
    width: fog.canvasRef.current?.clientWidth ?? 0,
    height: fog.canvasRef.current?.clientHeight ?? 0,
  });

  const { sendStroke, sendFog } = useSupabaseSync({
    onRemoteStroke: handleRemoteStroke,
    onRemoteFog: handleBreath,
  });

  // 自分が今描いている 1 画の点（相手に送るため）
  const strokePointsRef = useRef<Point[]>([]);

  const inputHandlers = useWindowInput({
    onInputStart: (point, pointerType) => {
      strokePointsRef.current = [point];
      fog.wipe(null, point);
      drawing.beginStroke(point, pointerType !== 'pen');
      notifyActivity();
    },
    onInputMove: (from, to) => {
      strokePointsRef.current.push(to);
      fog.wipe(from, to);
      drawing.extendStroke(to);
      notifyActivity();
    },
    onInputEnd: () => {
      drawing.endStroke();
      if (strokePointsRef.current.length > 0) {
        const { width, height } = glassSize();
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
        <DrawingLayer canvasRef={drawing.canvasRef} />
        <FogLayer canvasRef={fog.canvasRef} />
        {weatherCode !== undefined && <WeatherOverlay weatherCode={weatherCode} />}
      </WindowFrame>
      <div className={styles.controls}>
        <TemperatureSlider value={roomTemperatureC} onChange={setRoomTemperatureC} />
        <HaaDetector onDetect={handleBreathDetected} />
        <p className={styles.sync}>{SYNC_STATUS_TEXT[connectionStatus]}</p>
      </div>
    </div>
  );
}
