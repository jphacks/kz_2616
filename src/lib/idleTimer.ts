export interface IdleTimer {
  /** 操作があったことを知らせる。最後の操作から duration 経つとコールバックを呼ぶ */
  touch: () => void;
  /** 待機中のコールバックを取り消す */
  cancel: () => void;
}

/** 操作が止まってから durationMs 経ったら onIdle を呼ぶタイマーを作る */
export function createIdleTimer(durationMs: number, onIdle: () => void): IdleTimer {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  const touch = () => {
    cancel();
    timeoutId = setTimeout(() => {
      timeoutId = null;
      onIdle();
    }, durationMs);
  };

  return { touch, cancel };
}
