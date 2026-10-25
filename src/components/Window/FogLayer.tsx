'use client';

import type { RefObject } from 'react';

import { FOG_OPACITY } from '@/lib/fog';

import styles from './FogLayer.module.css';

interface FogLayerProps {
  /** 曇りの Canvas を管理する useFogCanvas の ref */
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

/** 曇りを描く Canvas。入力は窓側で受けるため、ここでは操作を受け付けない */
export function FogLayer({ canvasRef }: FogLayerProps) {
  // 曇りは不透明に描き、濃さはここで決める（拭き跡は透明のまま）
  return (
    <canvas
      ref={canvasRef}
      className={styles.fog}
      style={{ opacity: FOG_OPACITY }}
      aria-hidden="true"
    />
  );
}
