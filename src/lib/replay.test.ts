import { describe, expect, it, vi } from 'vitest';

import { startStrokeReplay } from './replay';

describe('startStrokeReplay', () => {
  it('t がない点列は、すぐに順番どおりに全部渡す', () => {
    const apply = vi.fn();
    const onDone = vi.fn();
    startStrokeReplay(
      [
        { x: 0, y: 0 },
        { x: 1, y: 1 },
      ],
      apply,
      onDone,
    );

    expect(apply).toHaveBeenCalledTimes(2);
    expect(apply.mock.calls[1][0]).toEqual({ x: 0, y: 0 });
    expect(onDone).toHaveBeenCalledTimes(1);
  });
});

describe('startStrokeReplay（時刻つき）', () => {
  it('t が経った点から順に渡し、全部渡したら onDone を呼ぶ', () => {
    let now = 0;
    const frames: FrameRequestCallback[] = [];
    vi.stubGlobal('performance', { now: () => now });
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      frames.push(callback);
      return frames.length;
    });
    vi.stubGlobal('cancelAnimationFrame', () => {});

    const apply = vi.fn();
    const onDone = vi.fn();
    startStrokeReplay(
      [
        { x: 0, y: 0, t: 0 },
        { x: 1, y: 0, t: 100 },
        { x: 2, y: 0, t: 300 },
      ],
      apply,
      onDone,
    );

    // 最初のフレーム（経過 0ms）で、最初の点だけ
    now = 0;
    frames.shift()?.(0);
    expect(apply).toHaveBeenCalledTimes(1);

    // 150ms で、2 点目まで
    now = 150;
    frames.shift()?.(150);
    expect(apply).toHaveBeenCalledTimes(2);
    expect(apply.mock.calls[1][0]).toEqual({ x: 0, y: 0, t: 0 });

    // 300ms で最後の点まで渡し終わる
    now = 300;
    frames.shift()?.(300);
    expect(apply).toHaveBeenCalledTimes(3);
    expect(onDone).toHaveBeenCalledTimes(1);

    vi.unstubAllGlobals();
  });
});
