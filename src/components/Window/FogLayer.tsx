'use client';

import type { RefObject } from 'react';

import styles from './FogLayer.module.css';

interface FogLayerProps {
  /** 曇りの Canvas を管理する useFogCanvas の ref */
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

/** 曇りを描く Canvas。入力は窓側で受けるため、ここでは操作を受け付けない */
export function FogLayer({ canvasRef }: FogLayerProps) {
  return <canvas ref={canvasRef} className={styles.fog} aria-hidden="true" />;
}
