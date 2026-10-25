import { describe, expect, it } from 'vitest';

import { toLocalPoints, toNormalizedPoints } from './normalizePoints';

describe('normalizePoints', () => {
  it('窓の大きさに対する割合に変換する', () => {
    expect(toNormalizedPoints([{ x: 100, y: 50 }], 400, 200)).toEqual([
      { x: 0.25, y: 0.25, pressure: undefined },
    ]);
  });

  it('割合を、別の大きさの窓の座標に戻すと、同じ位置になる', () => {
    // iPad（大きい窓）でなぞった点を、Mac（小さい窓）で同じ位置に描く
    const original = [{ x: 300, y: 600 }];
    const normalized = toNormalizedPoints(original, 1000, 800);
    expect(toLocalPoints(normalized, 500, 400)).toEqual([{ x: 150, y: 300, pressure: undefined }]);
  });

  it('大きさが 0 のときは空を返す', () => {
    expect(toNormalizedPoints([{ x: 1, y: 1 }], 0, 0)).toEqual([]);
  });
});
