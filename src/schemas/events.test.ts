import { describe, expect, it } from 'vitest';

import { parseSyncEvent } from './events';

describe('parseSyncEvent', () => {
  it('正しい筆跡イベントを受け付ける', () => {
    const event = {
      type: 'stroke',
      points: [
        { x: 1, y: 2 },
        { x: 3, y: 4, pressure: 0.5 },
      ],
      timestamp: 1000,
    };
    expect(parseSyncEvent(event)).toEqual(event);
  });

  it('正しい息のイベントを受け付ける', () => {
    expect(parseSyncEvent({ type: 'fog', timestamp: 1000 })).toEqual({
      type: 'fog',
      timestamp: 1000,
    });
  });

  it('未知の種類・形式が違うものは null を返す', () => {
    expect(parseSyncEvent({ type: 'unknown', timestamp: 1 })).toBeNull();
    expect(parseSyncEvent({ type: 'stroke', points: 'abc', timestamp: 1 })).toBeNull();
    expect(parseSyncEvent({ type: 'fog' })).toBeNull();
    expect(parseSyncEvent(null)).toBeNull();
  });

  it('座標が数値でない・無限大の点は弾く', () => {
    expect(parseSyncEvent({ type: 'stroke', points: [{ x: 'a', y: 1 }], timestamp: 1 })).toBeNull();
    expect(
      parseSyncEvent({ type: 'stroke', points: [{ x: Infinity, y: 1 }], timestamp: 1 }),
    ).toBeNull();
  });
});
