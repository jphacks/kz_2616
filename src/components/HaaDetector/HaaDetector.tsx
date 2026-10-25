'use client';

import { useCallback, useEffect, useState } from 'react';

import { CONFIG } from '@/config';
import { useHaaDetection } from '@/hooks/useHaaDetection';
import { unlockAudio } from '@/lib/audio';
import { HAA_SENSITIVITY_THRESHOLDS } from '@/lib/haaDetection';
import { MicIcon, SnowflakeIcon } from '@/components/ui/icons';
import { useAppStore } from '@/stores/useAppStore';

import styles from './HaaDetector.module.css';

interface HaaDetectorProps {
  /** 「はー」を検出したときに呼ばれる */
  onDetect?: () => void;
  /** デバッグ用の結露ボタンを押したときに呼ばれる（息を検出したときと同じ動き） */
  onDebugCondense?: () => void;
}

/**
 * マイクで「はー」を聞くスイッチと、その状態表示。
 * 検出のたびに、CONFIG.HAA_MUTE_MS の間マイクの音を無視する。
 */
export function HaaDetector({ onDetect, onDebugCondense }: HaaDetectorProps) {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const sensitivity = useAppStore((state) => state.haaSensitivity);
  const thresholds = HAA_SENSITIVITY_THRESHOLDS[sensitivity];

  const handleDetect = useCallback(() => {
    setIsMuted(true);
    onDetect?.();
  }, [onDetect]);

  const { isListening, error, levels } = useHaaDetection({
    enabled: isActive,
    muted: isMuted,
    thresholds,
    onDetect: handleDetect,
  });

  // 一時停止の時間が過ぎたら、聞き取りを再開する
  useEffect(() => {
    if (!isMuted) {
      return;
    }
    const timeoutId = setTimeout(() => setIsMuted(false), CONFIG.HAA_MUTE_MS);
    return () => clearTimeout(timeoutId);
  }, [isMuted]);

  // マイクのオン・オフは必ずボタンのタップから行う（iOS の制限のため）。
  // 音声の再開もタップの中で行う必要がある
  const handleToggle = () => {
    unlockAudio();
    setIsActive((previous) => !previous);
    setIsMuted(false);
  };

  return (
    <div className={styles.detector}>
      <div className={styles.row}>
        <button
          type="button"
          className={`${styles.iconButton} ${isActive ? styles.active : ''}`}
          onClick={handleToggle}
          aria-label={isActive ? 'マイクを止める' : '息を聞く（マイクをオン）'}
          aria-pressed={isActive}
          title={isActive ? 'マイクを止める' : '息を聞く（マイクをオン）'}
        >
          <MicIcon />
        </button>
        {onDebugCondense && (
          <button
            type="button"
            className={styles.iconButton}
            onClick={onDebugCondense}
            aria-label="結露を発生させる（デバッグ）"
            title="結露を発生させる（デバッグ）"
          >
            <SnowflakeIcon />
          </button>
        )}
      </div>
      <p className={styles.status} role="status">
        {getStatusText({ isActive, isMuted, isListening, error })}
      </p>
      {isListening && levels && (
        <p className={styles.levels}>
          音量 {levels.rms.toFixed(3)}（基準 {thresholds.rms}） / ノイズ度{' '}
          {levels.flatness.toFixed(2)}（基準 {thresholds.flatness}）
        </p>
      )}
    </div>
  );
}

interface StatusInput {
  isActive: boolean;
  isMuted: boolean;
  isListening: boolean;
  error: Error | null;
}

/** 画面に出す状態の文言 */
export function getStatusText({ isActive, isMuted, isListening, error }: StatusInput): string {
  if (!isActive) {
    return 'マイクはオフです';
  }
  if (error) {
    return `マイクを使えません（${error.message}）`;
  }
  if (isMuted) {
    return '一時停止中（まもなく再開します）';
  }
  if (isListening) {
    return '聞いています';
  }
  return 'マイクを準備しています…';
}
