import { type RefObject, useCallback, useEffect, useRef } from 'react';

import { copyCanvas, fitCanvasToDisplay } from '@/lib/canvas';
import { FOG_FILL_STYLE, interpolateStamps, wipeRadiusFor } from '@/lib/fog';
import { createFogPattern } from '@/lib/fogTexture';
import type { Point } from '@/types';

/** 曇りの色を塗る。模様が作れなければ単色で塗る */
function fillWithFog(context: CanvasRenderingContext2D, width: number, height: number): void {
  context.fillStyle = createFogPattern(context) ?? FOG_FILL_STYLE;
  context.fillRect(0, 0, width, height);
}

/** 指の跡（点列）を、拭き取りとして描く */
function stampWipe(
  context: CanvasRenderingContext2D,
  from: Point | null,
  to: Point,
  radius: number,
): void {
  context.save();
  context.globalCompositeOperation = 'destination-out';
  context.fillStyle = '#000';
  for (const stamp of interpolateStamps(from, to, radius / 2)) {
    context.beginPath();
    context.arc(stamp.x, stamp.y, radius, 0, Math.PI * 2);
    context.fill();
  }
  context.restore();
}

/** 全面が曇った状態の Canvas（フェードの行き先） */
function createFogCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (context) {
    fillWithFog(context, width, height);
  }
  return canvas;
}

export interface UseFogCanvasResult {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  /** 窓全体を曇らせる（一瞬で切り替える） */
  fillFog: () => void;
  /** durationMs かけて、徐々に窓全体を曇らせる。終わったら onComplete を呼ぶ */
  fadeIn: (durationMs: number, onComplete?: () => void) => void;
  /** durationMs かけて、徐々に曇りを消して透明に戻す */
  fadeOut: (durationMs: number) => void;
  /**
   * from から to までを拭き取る。from が null なら to の点だけを拭く。
   * radius を省くと、点に付いた太さか、なぞる速さに合わせた太さで拭く。
   */
  wipe: (from: Point | null, to: Point, radius?: number) => void;
}

/**
 * 曇りの Canvas を管理する。
 * サイズが変わると曇りを張り直す（拭き取った状態は失われる）。
 */
export function useFogCanvas(): UseFogCanvasResult {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fadeFrameRef = useRef<number | null>(null);
  // フェードアウトの元になる曇りの状態（フェードアウト中の拭き跡もここに書き足す）
  const fadeSourceRef = useRef<HTMLCanvasElement | null>(null);

  const fillFog = useCallback(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    context.save();
    context.globalCompositeOperation = 'source-over';
    fillWithFog(context, canvas.clientWidth, canvas.clientHeight);
    context.restore();
  }, []);

  const cancelFade = useCallback(() => {
    if (fadeFrameRef.current !== null) {
      cancelAnimationFrame(fadeFrameRef.current);
      fadeFrameRef.current = null;
    }
    fadeSourceRef.current = null;
  }, []);

  const fadeIn = useCallback(
    (durationMs: number, onComplete?: () => void) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context) {
        return;
      }

      cancelFade();
      // 今の状態と、全面が曇った状態を用意し、時間に応じて混ぜる
      const current = copyCanvas(canvas);
      const fullFog = createFogCanvas(canvas.width, canvas.height);
      const startMs = performance.now();

      const step = () => {
        const progress = Math.min((performance.now() - startMs) / durationMs, 1);

        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalCompositeOperation = 'source-over';
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.globalAlpha = 1 - progress;
        context.drawImage(current, 0, 0);
        // 足し合わせると、透明度は「今の状態」と「全面の曇り」の割合で決まる。途中で濃くならない
        context.globalCompositeOperation = 'lighter';
        context.globalAlpha = progress;
        context.drawImage(fullFog, 0, 0);
        context.restore();

        if (progress < 1) {
          fadeFrameRef.current = requestAnimationFrame(step);
        } else {
          fadeFrameRef.current = null;
          onComplete?.();
        }
      };

      step();
    },
    [cancelFade],
  );

  const fadeOut = useCallback(
    (durationMs: number) => {
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');
      if (!canvas || !context) {
        return;
      }

      cancelFade();
      // 開始時点の曇りを元にして、時間に応じて透明度を下げる。
      // 毎フレーム重ねると 8 ビットの丸めで止まってしまうため、元の画像から描き直す
      const source = copyCanvas(canvas);
      fadeSourceRef.current = source;
      const startMs = performance.now();

      const step = () => {
        const progress = Math.min((performance.now() - startMs) / durationMs, 1);

        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalCompositeOperation = 'source-over';
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.globalAlpha = 1 - progress;
        context.drawImage(fadeSourceRef.current ?? source, 0, 0);
        context.restore();

        if (progress < 1) {
          fadeFrameRef.current = requestAnimationFrame(step);
        } else {
          fadeFrameRef.current = null;
          fadeSourceRef.current = null;
        }
      };

      step();
    },
    [cancelFade],
  );

  // 画面を離れたら、徐々に曇らせる処理を止める
  useEffect(() => cancelFade, [cancelFade]);

  const wipe = useCallback((from: Point | null, to: Point, radius?: number) => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }

    // 太さは、呼び出し側の指定 → 点に付いた太さ → なぞる速さ の順に決める
    const size = radius ?? to.r ?? wipeRadiusFor(from, to);
    stampWipe(context, from, to, size);

    // フェードアウト中は、元になる曇りにも同じ跡を書き足す（跡が消えないように）。
    // 元の画像は端末の画素数のままなので、CSS ピクセルの座標を拡大率（dpr）で合わせてから描く
    const source = fadeSourceRef.current;
    const sourceContext = source?.getContext('2d');
    if (sourceContext) {
      const dpr = window.devicePixelRatio || 1;
      sourceContext.save();
      sourceContext.setTransform(dpr, 0, 0, dpr, 0, 0);
      stampWipe(sourceContext, from, to, size);
      sourceContext.restore();
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    let hasFog = false;

    // iPad などではアドレスバーの出入りで大きさがわずかに変わる。
    // そのたびに曇りを張り直すと拭いた跡が消えるため、既存の内容を引き継ぐ
    const resize = () => {
      const snapshot = hasFog ? copyCanvas(canvas) : null;
      const context = fitCanvasToDisplay(canvas);
      if (!context) {
        return;
      }
      hasFog = true;

      // 最初は曇っていない（窓は透明）。曇りは息でだけ付く
      if (!snapshot) {
        return;
      }

      // 全面を曇らせてから、前の状態で曇りが残っていた部分だけを残す（拭いた跡は透明のまま）
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      fillWithFog(context, canvas.width, canvas.height);
      context.globalCompositeOperation = 'destination-in';
      context.drawImage(snapshot, 0, 0, canvas.width, canvas.height);
      context.restore();
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    return () => observer.disconnect();
  }, [fillFog]);

  return { canvasRef, fillFog, fadeIn, fadeOut, wipe };
}
