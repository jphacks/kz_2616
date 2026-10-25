import { getStroke } from 'perfect-freehand';

import type { Stroke } from '@/types';

/**
 * 手書きのインクの色。現在は透明にしており、見えるのは曇りを拭いた跡だけ。
 * 色を付けるときはここを変える（記録された画はそのまま描き直される）。
 */
export const INK_FILL_STYLE = 'rgba(0, 0, 0, 0)';

/** 筆圧が未指定のときに使う値 (perfect-freehand は 0〜1) */
const DEFAULT_PRESSURE = 0.5;

const STROKE_OPTIONS = {
  size: 8,
  thinning: 0.5,
  smoothing: 0.5,
  streamline: 0.5,
};

/** 輪郭の Path を組み立てるのに必要な Canvas の機能 */
export type PathContext = Pick<
  CanvasRenderingContext2D,
  'beginPath' | 'moveTo' | 'lineTo' | 'closePath' | 'fill'
>;

/** 1画を、perfect-freehand が作る輪郭で塗りつぶす */
export function drawStroke(context: PathContext, stroke: Stroke): void {
  const outline = getStroke(
    stroke.points.map((point) => [point.x, point.y, point.pressure ?? DEFAULT_PRESSURE]),
    { ...STROKE_OPTIONS, simulatePressure: stroke.simulatePressure },
  );
  const [first, ...rest] = outline;
  if (!first) {
    return;
  }

  context.beginPath();
  context.moveTo(first[0], first[1]);
  for (const [x, y] of rest) {
    context.lineTo(x, y);
  }
  context.closePath();
  context.fill();
}
