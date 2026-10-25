'use client';

import { type ChangeEvent, useState } from 'react';

import { CONFIG } from '@/config';
import { useAppStore } from '@/stores/useAppStore';
import type { HaaSensitivity, WeatherOverride } from '@/types';

import styles from './SettingsMenu.module.css';

// 撮影用の時間の選択肢(ms)。既定値（CONFIG）は選択肢に必ず含める
const FOG_FADE_OUT_OPTIONS: { value: number; label: string }[] = [
  { value: 5_000, label: '5 秒' },
  { value: 10_000, label: '10 秒' },
  { value: 30_000, label: '30 秒' },
  {
    value: CONFIG.BREATH_FOG_FADE_OUT_MS,
    label: `${CONFIG.BREATH_FOG_FADE_OUT_MS / 1000} 秒（通常）`,
  },
];

const DRIP_ACTIVE_OPTIONS: { value: number; label: string }[] = [
  { value: 5_000, label: '5 秒' },
  { value: 10_000, label: '10 秒' },
  { value: 30_000, label: '30 秒' },
  { value: CONFIG.DRIP_ACTIVE_MS, label: `${CONFIG.DRIP_ACTIVE_MS / 1000} 秒（通常）` },
];

const WEATHER_OPTIONS: { value: WeatherOverride; label: string }[] = [
  { value: 'actual', label: '実際の天気' },
  { value: 'clear', label: '晴れ' },
  { value: 'cloudy', label: '曇り' },
  { value: 'rain', label: '雨' },
  { value: 'snow', label: '雪' },
];

const SENSITIVITY_OPTIONS: { value: HaaSensitivity; label: string }[] = [
  { value: 'high', label: '高（小さい息でも反応）' },
  { value: 'normal', label: '標準' },
  { value: 'low', label: '低（強い息だけ反応）' },
];

/**
 * 左上のプルダウン。デモ用に、相手の窓に映す気象情報とマイクの感度、
 * 曇りが戻るまでの時間と水滴の時間を変える（撮影で待ち時間を調整するため）。
 */
export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const weatherOverride = useAppStore((state) => state.weatherOverride);
  const setWeatherOverride = useAppStore((state) => state.setWeatherOverride);
  const haaSensitivity = useAppStore((state) => state.haaSensitivity);
  const setHaaSensitivity = useAppStore((state) => state.setHaaSensitivity);
  const fogFadeOutMs = useAppStore((state) => state.fogFadeOutMs);
  const setFogFadeOutMs = useAppStore((state) => state.setFogFadeOutMs);
  const dripActiveMs = useAppStore((state) => state.dripActiveMs);
  const setDripActiveMs = useAppStore((state) => state.setDripActiveMs);
  const demoTime = useAppStore((state) => state.demoTime);
  const setDemoTime = useAppStore((state) => state.setDemoTime);

  const handleWeatherChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setWeatherOverride(event.target.value as WeatherOverride);
  };

  const handleSensitivityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setHaaSensitivity(event.target.value as HaaSensitivity);
  };

  const handleFogFadeOutChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setFogFadeOutMs(Number(event.target.value));
  };

  const handleDripActiveChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setDripActiveMs(Number(event.target.value));
  };

  // 空にすると実際の時刻に戻る
  const handleDemoTimeChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDemoTime(event.target.value || null);
  };

  const handleDemoTimeReset = () => setDemoTime(null);

  return (
    <div className={styles.menu}>
      <button
        type="button"
        className={styles.toggle}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((previous) => !previous)}
      >
        設定 {isOpen ? '▴' : '▾'}
      </button>
      {isOpen && (
        <div className={styles.panel}>
          <label className={styles.field}>
            <span>相手の窓の気象情報</span>
            <select value={weatherOverride} onChange={handleWeatherChange}>
              {WEATHER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>マイクの感度</span>
            <select value={haaSensitivity} onChange={handleSensitivityChange}>
              {SENSITIVITY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>曇りが透明に戻るまで</span>
            <select value={fogFadeOutMs} onChange={handleFogFadeOutChange}>
              {FOG_FADE_OUT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>水滴が垂れる時間</span>
            <select value={dripActiveMs} onChange={handleDripActiveChange}>
              {DRIP_ACTIVE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className={styles.field}>
            <span>背景の時刻（撮影用）</span>
            <input type="time" value={demoTime ?? ''} onChange={handleDemoTimeChange} />
          </label>
          {demoTime && (
            <button type="button" className={styles.reset} onClick={handleDemoTimeReset}>
              実際の時刻に戻す
            </button>
          )}
        </div>
      )}
    </div>
  );
}
