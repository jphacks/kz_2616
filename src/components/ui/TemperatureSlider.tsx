'use client';

import { type ChangeEvent } from 'react';

import { CONFIG } from '@/config';

import styles from './TemperatureSlider.module.css';

interface TemperatureSliderProps {
  /** 室温(℃) */
  value: number;
  onChange: (temperatureC: number) => void;
}

/** 室温(ダミー値)を入力するスライダー */
export function TemperatureSlider({ value, onChange }: TemperatureSliderProps) {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Number(event.target.value));
  };

  return (
    <label className={styles.slider}>
      <span className={styles.label}>室温 {value.toFixed(1)}℃</span>
      <input
        type="range"
        min={CONFIG.ROOM_TEMPERATURE_MIN_C}
        max={CONFIG.ROOM_TEMPERATURE_MAX_C}
        step={0.5}
        value={value}
        onChange={handleChange}
      />
    </label>
  );
}
