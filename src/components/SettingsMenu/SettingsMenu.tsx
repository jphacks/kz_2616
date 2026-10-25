'use client';

import { type ChangeEvent, useState } from 'react';

import { useAppStore } from '@/stores/useAppStore';
import type { HaaSensitivity, WeatherOverride } from '@/types';

import styles from './SettingsMenu.module.css';

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
 * 左上のプルダウン。デモ用に気象情報とマイクの感度を変える。
 */
export function SettingsMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const weatherOverride = useAppStore((state) => state.weatherOverride);
  const setWeatherOverride = useAppStore((state) => state.setWeatherOverride);
  const haaSensitivity = useAppStore((state) => state.haaSensitivity);
  const setHaaSensitivity = useAppStore((state) => state.setHaaSensitivity);

  const handleWeatherChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setWeatherOverride(event.target.value as WeatherOverride);
  };

  const handleSensitivityChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setHaaSensitivity(event.target.value as HaaSensitivity);
  };

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
            <span>気象情報</span>
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
        </div>
      )}
    </div>
  );
}
