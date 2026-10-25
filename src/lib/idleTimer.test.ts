import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createIdleTimer } from './idleTimer';

describe('createIdleTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('操作がなければ duration 経過後に1度だけ呼ばれる', () => {
    const onIdle = vi.fn();
    const timer = createIdleTimer(1000, onIdle);

    timer.touch();
    vi.advanceTimersByTime(999);
    expect(onIdle).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onIdle).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('操作のたびに待ち時間がリセットされる', () => {
    const onIdle = vi.fn();
    const timer = createIdleTimer(1000, onIdle);

    timer.touch();
    vi.advanceTimersByTime(800);
    timer.touch();
    vi.advanceTimersByTime(800);
    expect(onIdle).not.toHaveBeenCalled();

    vi.advanceTimersByTime(200);
    expect(onIdle).toHaveBeenCalledTimes(1);
  });

  it('cancel すると呼ばれない', () => {
    const onIdle = vi.fn();
    const timer = createIdleTimer(1000, onIdle);

    timer.touch();
    timer.cancel();
    vi.advanceTimersByTime(5000);

    expect(onIdle).not.toHaveBeenCalled();
  });
});
