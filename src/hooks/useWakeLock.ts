import { useEffect } from 'react';

import { requestScreenWakeLock, type WakeLockSentinelLike } from '@/lib/wakeLock';

/**
 * 窓を開いている間は画面を消さない。
 * ブラウザは、タブが隠れると画面の点灯を解除するため、戻ったときに頼み直す。
 * 対応していない端末や拒否された場合は、何もせずに窓を動かし続ける。
 */
export function useWakeLock(): void {
  useEffect(() => {
    let sentinel: WakeLockSentinelLike | null = null;
    let disposed = false;

    const acquire = async () => {
      if (document.visibilityState !== 'visible') {
        return;
      }
      const next = await requestScreenWakeLock(
        'wakeLock' in navigator ? navigator.wakeLock : undefined,
      );
      // 頼んでいる間に画面を離れていたら、すぐに返す
      if (disposed) {
        void next?.release().catch(() => undefined);
        return;
      }
      sentinel = next;
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void acquire();
      }
    };

    void acquire();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      void sentinel?.release().catch(() => undefined);
      sentinel = null;
    };
  }, []);
}
