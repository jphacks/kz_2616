import { useCallback, useEffect, useRef } from 'react';

import { CONFIG } from '@/config';
import { createIdleTimer, type IdleTimer } from '@/lib/idleTimer';

/**
 * 最後の操作から CONFIG.FOG_RECOVER_MS 経つと onRecover を呼ぶ。
 * 返り値の notifyActivity を操作のたびに呼ぶと、待ち時間がリセットされる。
 */
export function useFogRecovery(onRecover: () => void): () => void {
  const timerRef = useRef<IdleTimer | null>(null);
  const onRecoverRef = useRef(onRecover);

  useEffect(() => {
    onRecoverRef.current = onRecover;
  }, [onRecover]);

  useEffect(() => {
    const timer = createIdleTimer(CONFIG.FOG_RECOVER_MS, () => onRecoverRef.current());
    timerRef.current = timer;
    return () => {
      timer.cancel();
      timerRef.current = null;
    };
  }, []);

  return useCallback(() => {
    timerRef.current?.touch();
  }, []);
}
