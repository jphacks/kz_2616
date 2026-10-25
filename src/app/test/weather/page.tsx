'use client';

import { useEffect, useState } from 'react';

import { FogLayer } from '@/components/Window/FogLayer';
import { WeatherOverlay } from '@/components/Window/WeatherOverlay';
import { CONFIG } from '@/config';
import { useFogCanvas } from '@/hooks/useFogCanvas';
import { useWaterDrips } from '@/hooks/useWaterDrips';
import { useWindowInput } from '@/hooks/useWindowInput';

import styles from './page.module.css';

/** 確認したい天気。WMO weather code の代表値 */
const SAMPLES: { label: string; code: number }[] = [
  { label: '快晴', code: 0 },
  { label: '晴れ時々曇り', code: 2 },
  { label: '曇り', code: 3 },
  { label: '霧', code: 45 },
  { label: '小雨', code: 61 },
  { label: '強い雨', code: 63 },
  { label: '雪', code: 71 },
  { label: '雷雨', code: 95 },
];

const MINUTES_PER_DAY = 24 * 60;
/** 日の出・日没を仮定する時刻(分)。朝焼け・夕焼けを確認するため */
const ASSUMED_SUNRISE_MINUTES = 6 * 60;
const ASSUMED_SUNSET_MINUTES = 18 * 60;

function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

/** 今日の指定した時刻を、ISO 8601 の文字列にする */
function todayAt(minutes: number): { date: Date; iso: string } {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setMinutes(minutes);
  return { date, iso: date.toISOString() };
}

export default function WeatherDebugPage() {
  const [sampleIndex, setSampleIndex] = useState(0);
  const [minutes, setMinutes] = useState(12 * 60);
  const [showFog, setShowFog] = useState(false);
  const fog = useFogCanvas();
  const { fillFog, wipe, fadeIn, fadeOut } = fog;
  // 確認画面には相手がいないので、落ち切った水滴は送らない
  const drips = useWaterDrips(
    wipe,
    () => ({
      width: fog.canvasRef.current?.clientWidth ?? 0,
      height: fog.canvasRef.current?.clientHeight ?? 0,
    }),
    () => {},
  );

  // 曇りを表示にしたら、全面を曇らせる（拭いた跡は残さない）
  useEffect(() => {
    if (showFog) {
      fillFog();
    }
  }, [showFog, fillFog]);

  const inputHandlers = useWindowInput({
    onInputStart: (point) => {
      wipe(null, point);
      drips.markDrawn(point);
    },
    onInputMove: (from, to) => {
      wipe(from, to);
      drips.markDrawn(to);
    },
    onInputEnd: () => {},
  });

  // 息を検出したときと同じ流れ（曇らせて、徐々に戻す。その間は水滴も垂れる）
  const breathe = () => {
    setShowFog(true);
    fadeIn(CONFIG.BREATH_FOG_FADE_MS, () => fadeOut(CONFIG.BREATH_FOG_FADE_OUT_MS));
    drips.start(CONFIG.DRIP_ACTIVE_MS);
  };

  const sample = SAMPLES[sampleIndex];
  const sunrise = todayAt(ASSUMED_SUNRISE_MINUTES);
  const sunset = todayAt(ASSUMED_SUNSET_MINUTES);
  const now = todayAt(minutes).date;

  return (
    <main className={styles.page}>
      <div className={styles.controls}>
        <div className={styles.samples}>
          {SAMPLES.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={`${styles.sample} ${index === sampleIndex ? styles.sampleActive : ''}`}
              onClick={() => setSampleIndex(index)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <label>
          時刻 {formatTime(minutes)}{' '}
          <input
            type="range"
            min={0}
            max={MINUTES_PER_DAY - 1}
            step={5}
            value={minutes}
            onChange={(event) => setMinutes(Number(event.target.value))}
          />
        </label>
        <button type="button" className={styles.sample} onClick={breathe}>
          息で曇らせる
        </button>
        <label>
          <input
            type="checkbox"
            checked={showFog}
            onChange={(event) => setShowFog(event.target.checked)}
          />{' '}
          曇りを重ねる
        </label>
      </div>

      <div
        className={styles.stage}
        style={{ aspectRatio: CONFIG.WINDOW_ASPECT }}
        {...inputHandlers}
      >
        <WeatherOverlay
          weatherCode={sample.code}
          sunrise={sunrise.iso}
          sunset={sunset.iso}
          now={now}
        />
        <div className={showFog ? undefined : styles.hidden}>
          <FogLayer canvasRef={fog.canvasRef} />
        </div>
      </div>
    </main>
  );
}
