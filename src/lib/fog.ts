import type { Point } from '@/types';

/** 曇りの色（RGB）。少し透けて、下の窓が見える程度の白 */
const FOG_COLOR_RGB = '232, 238, 242';

/** 曇りの最大の濃さ */
export const FOG_OPACITY = 0.96;

export const FOG_FILL_STYLE = `rgba(${FOG_COLOR_RGB}, ${FOG_OPACITY})`;

/** 拭き取りの半径(px) */
export const WIPE_RADIUS = 14;

/**
 * 直前の点から今の点までを、間隔 spacing ごとの点列に分割する。
 * 速く動かしても線が途切れないよう、なぞりの間を埋めるために使う。
 * 直前の点がなければ今の点だけを返す。
 */
export function interpolateStamps(from: Point | null, to: Point, spacing: number): Point[] {
  if (from === null) {
    return [to];
  }

  const distance = Math.hypot(to.x - from.x, to.y - from.y);
  const steps = Math.max(1, Math.ceil(distance / spacing));

  return Array.from({ length: steps }, (_, index) => {
    const t = (index + 1) / steps;
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
  });
}
