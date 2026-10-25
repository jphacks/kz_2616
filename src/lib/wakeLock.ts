/** Screen Wake Lock API のうち、使う部分だけの形。テストで差し替えられるようにする */
export interface WakeLockSentinelLike {
  release: () => Promise<void>;
}

export interface WakeLockApiLike {
  request: (type: 'screen') => Promise<WakeLockSentinelLike>;
}

/**
 * 画面の常時点灯を頼む。対応していない端末や、拒否された場合は null を返す。
 * 取れなくても窓は動くので、例外は外に出さない。
 */
export async function requestScreenWakeLock(
  api: WakeLockApiLike | undefined,
): Promise<WakeLockSentinelLike | null> {
  if (!api) {
    return null;
  }
  try {
    return await api.request('screen');
  } catch {
    return null;
  }
}
