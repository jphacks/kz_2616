import { describe, expect, it } from 'vitest';

import { interpolateStamps, WIPE_RADIUS, wipeRadiusFor } from './fog';

describe('interpolateStamps', () => {
  it('直前の点がなければ今の点だけを返す', () => {
    expect(interpolateStamps(null, { x: 10, y: 20 }, 5)).toEqual([{ x: 10, y: 20 }]);
  });

  it('間隔ごとに点を並べ、終点で止まる', () => {
    const stamps = interpolateStamps({ x: 0, y: 0 }, { x: 10, y: 0 }, 5);

    expect(stamps).toEqual([
      { x: 5, y: 0 },
      { x: 10, y: 0 },
    ]);
  });

  it('移動が短くても最低1点は返す', () => {
    const stamps = interpolateStamps({ x: 0, y: 0 }, { x: 1, y: 0 }, 5);
    expect(stamps).toEqual([{ x: 1, y: 0 }]);
  });

  it('斜めの移動でも間隔は超えない', () => {
    const stamps = interpolateStamps({ x: 0, y: 0 }, { x: 30, y: 40 }, 10);
    const last = stamps[stamps.length - 1];

    expect(stamps).toHaveLength(5);
    expect(last).toEqual({ x: 30, y: 40 });
  });
});

describe('wipeRadiusFor', () => {
  it('時刻がなければ基本の半径を使う', () => {
    expect(wipeRadiusFor({ x: 0, y: 0 }, { x: 10, y: 0 })).toBe(WIPE_RADIUS);
  });

  it('ゆっくり拭くほど太く、速く拭くほど細くなる', () => {
    const slow = wipeRadiusFor({ x: 0, y: 0, t: 0 }, { x: 1, y: 0, t: 100 });
    const fast = wipeRadiusFor({ x: 0, y: 0, t: 0 }, { x: 200, y: 0, t: 100 });

    expect(slow).toBeGreaterThan(WIPE_RADIUS);
    expect(fast).toBeLessThan(WIPE_RADIUS);
    expect(slow).toBeGreaterThan(fast);
  });
});
