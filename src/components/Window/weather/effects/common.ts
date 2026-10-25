import type { Random } from './types';

export function range(random: Random, min: number, max: number): number {
  return min + (max - min) * random();
}

/**
 * 横方向に流す。画面を横切るのに crossSec 秒かかる速さで動かし、
 * 右端から抜けたら左端から戻す（中心の座標を返す）。
 */
export function driftX(
  x: number,
  spriteWidth: number,
  width: number,
  crossSec: number,
  dtMs: number,
  speed: number,
): number {
  const span = width + spriteWidth;
  const moved = x + (span / crossSec) * (dtMs / 1000) * speed;
  // 0 以上の余りにそろえて、画面外の周期で戻す
  const wrapped = (((moved + spriteWidth / 2) % span) + span) % span;
  return wrapped - spriteWidth / 2;
}
