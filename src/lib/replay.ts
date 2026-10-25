import type { Point } from '@/types';

/**
 * 相手の画を、書いた時間（t）に沿って再生する。
 * 各点は、t が経過した時点で apply に渡す（直前の点と今の点で 1 区間ずつ描く）。
 * t がない点列は、すぐに全部を渡す。返り値を呼ぶと再生を止める。
 */
export function startStrokeReplay(
  points: Point[],
  apply: (from: Point | null, to: Point) => void,
  onDone?: () => void,
): () => void {
  if (points.some((point) => point.t === undefined)) {
    let previous: Point | null = null;
    for (const point of points) {
      apply(previous, point);
      previous = point;
    }
    onDone?.();
    return () => {};
  }

  let frame: number | null = null;
  let index = 0;
  let previous: Point | null = null;
  const startMs = performance.now();

  const tick = (now: number) => {
    const elapsed = now - startMs;
    while (index < points.length && (points[index].t ?? 0) <= elapsed) {
      const point = points[index];
      apply(previous, point);
      previous = point;
      index += 1;
    }

    if (index < points.length) {
      frame = requestAnimationFrame(tick);
    } else {
      frame = null;
      onDone?.();
    }
  };

  frame = requestAnimationFrame(tick);
  return () => {
    if (frame !== null) {
      cancelAnimationFrame(frame);
      frame = null;
    }
  };
}
