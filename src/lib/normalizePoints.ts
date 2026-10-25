import type { Point } from '@/types';

/**
 * 点を、窓の大きさに対する割合（0〜1）に変換する。
 * 端末ごとに画面の大きさが違うため、送るときは割合にして、受け取る側で自分の大きさに戻す。
 */
export function toNormalizedPoints(points: Point[], width: number, height: number): Point[] {
  if (width <= 0 || height <= 0) {
    return [];
  }
  return points.map((point) => ({
    x: point.x / width,
    y: point.y / height,
    pressure: point.pressure,
    t: point.t,
    r: point.r,
  }));
}

/** 割合で表された点を、自分の窓の大きさの座標に戻す */
export function toLocalPoints(points: Point[], width: number, height: number): Point[] {
  return points.map((point) => ({
    x: point.x * width,
    y: point.y * height,
    pressure: point.pressure,
    t: point.t,
    r: point.r,
  }));
}
