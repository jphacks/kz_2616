import { type RefObject, useCallback, useEffect, useRef } from 'react';

import { drawStroke, INK_FILL_STYLE } from '@/lib/drawing';
import { fitCanvasToDisplay } from '@/lib/canvas';
import type { Point, Stroke } from '@/types';

export interface UseDrawingResult {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** 新しい画を始める */
  beginStroke: (point: Point, simulatePressure: boolean) => void;
  /** 進行中の画に点を追加する */
  extendStroke: (point: Point) => void;
  /** 進行中の画を確定する */
  endStroke: () => void;
  /** すべての画を消す */
  clear: () => void;
}

/**
 * 手書きの Canvas を管理する。
 * 画の一覧は保持し、点を追加するたびに全体を描き直す。
 */
export function useDrawing(): UseDrawingResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const currentStrokeRef = useRef<Stroke | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    context.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    context.fillStyle = INK_FILL_STYLE;
    for (const stroke of strokesRef.current) {
      drawStroke(context, stroke);
    }
    if (currentStrokeRef.current) {
      drawStroke(context, currentStrokeRef.current);
    }
  }, []);

  const beginStroke = useCallback(
    (point: Point, simulatePressure: boolean) => {
      currentStrokeRef.current = { points: [point], simulatePressure };
      redraw();
    },
    [redraw],
  );

  const extendStroke = useCallback(
    (point: Point) => {
      const current = currentStrokeRef.current;
      if (!current) {
        return;
      }
      current.points.push(point);
      redraw();
    },
    [redraw],
  );

  const endStroke = useCallback(() => {
    const current = currentStrokeRef.current;
    if (!current) {
      return;
    }
    strokesRef.current.push(current);
    currentStrokeRef.current = null;
    redraw();
  }, [redraw]);

  const clear = useCallback(() => {
    strokesRef.current = [];
    currentStrokeRef.current = null;
    redraw();
  }, [redraw]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const resize = () => {
      if (fitCanvasToDisplay(canvas)) {
        redraw();
      }
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [redraw]);

  return { canvasRef, beginStroke, extendStroke, endStroke, clear };
}
