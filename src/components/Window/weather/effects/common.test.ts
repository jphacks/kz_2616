import { describe, expect, it } from 'vitest';

import { driftX } from './common';

describe('driftX', () => {
  it('画面の右から抜けたあと、左側に戻る（画面の幅と同じ周期で繰り返す）', () => {
    const width = 1000;
    const spriteWidth = 200;
    let x = 0;
    let wrapped = false;
    for (let step = 0; step < 1000; step += 1) {
      const next = driftX(x, spriteWidth, width, 10, 100, 1);
      if (next < x) {
        wrapped = true;
      }
      // 絵の右端が画面の右を抜けるまで、左から出てくる位置は画面の外になる
      expect(next).toBeGreaterThanOrEqual(-spriteWidth / 2 - (width + spriteWidth));
      expect(next).toBeLessThanOrEqual(width + spriteWidth / 2);
      x = next;
    }
    expect(wrapped).toBe(true);
  });

  it('時間が経つと、crossSec 秒で画面を横切る距離だけ進む', () => {
    // 幅 1000 + 絵の幅 200 を 10 秒で進むので、1 秒あたり 120px
    const next = driftX(0, 200, 1000, 10, 1000, 1);
    expect(next).toBeCloseTo(120);
  });
});
