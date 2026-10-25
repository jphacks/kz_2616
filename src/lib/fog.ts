import type { Point } from '@/types';

/** 曇りの色（RGB）。少し透けて、下の窓が見える程度の白 */
export const FOG_COLOR = [232, 238, 242] as const;

/** 曇りの最大の濃さ。曇りは不透明に描き、この濃さは表示の透明度で決める */
export const FOG_OPACITY = 0.96;

/** 曇りは不透明に描く（縁を広げても、重なって濃くならないように） */
export const FOG_FILL_STYLE = `rgb(${FOG_COLOR.join(', ')})`;

/** 拭き取りの基本の半径(px) */
export const WIPE_RADIUS = 14;

/** 拭く速さ(px/ms)。これより遅ければ太く、速ければ細く拭く */
const WIPE_SLOW_SPEED = 0.1;
const WIPE_FAST_SPEED = 1;
/** 遅いときと速いときの、基本の半径に対する倍率 */
const WIPE_THICK_RATIO = 1.3;
const WIPE_THIN_RATIO = 0.6;

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

/**
 * 拭き取りの半径を、なぞる速さで決める。
 * ゆっくり拭くと太く、速く拭くと細くなり、線に緩急が付く。時刻がなければ基本の半径。
 */
export function wipeRadiusFor(from: Point | null, to: Point): number {
  if (from === null || from.t === undefined || to.t === undefined) {
    return WIPE_RADIUS;
  }
  const elapsed = to.t - from.t;
  if (elapsed <= 0) {
    return WIPE_RADIUS;
  }

  const speed = Math.hypot(to.x - from.x, to.y - from.y) / elapsed;
  const ratio = Math.min(
    Math.max((speed - WIPE_SLOW_SPEED) / (WIPE_FAST_SPEED - WIPE_SLOW_SPEED), 0),
    1,
  );
  const thickness = WIPE_THICK_RATIO + (WIPE_THIN_RATIO - WIPE_THICK_RATIO) * ratio;
  return WIPE_RADIUS * thickness;
}
