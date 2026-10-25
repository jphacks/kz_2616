'use client';

import type { RefObject } from 'react';

import styles from './DrawingLayer.module.css';

interface DrawingLayerProps {
  /** 手書きの Canvas を管理する useDrawing の ref */
  canvasRef: RefObject<HTMLCanvasElement | null>;
}

/** 手書きを描く Canvas。入力は窓側で受けるため、ここでは操作を受け付けない */
export function DrawingLayer({ canvasRef }: DrawingLayerProps) {
  return <canvas ref={canvasRef} className={styles.drawing} aria-hidden="true" />;
}
