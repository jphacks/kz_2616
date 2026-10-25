/** 全画面の切り替えに使う、ブラウザの機能の形。テストで差し替えられるようにする */
export interface FullscreenDocumentLike {
  fullscreenEnabled: boolean;
  fullscreenElement: unknown;
  exitFullscreen: () => Promise<void>;
}

export interface FullscreenTargetLike {
  requestFullscreen: () => Promise<void>;
}

/**
 * 全画面を入れる・出す。今の状態に応じて、切り替えた後に全画面かどうかを返す。
 * 拒否されたり対応していなかったりしても、例外は外に出さない（窓は今の表示のまま動く）。
 */
export async function toggleFullscreen(
  document: FullscreenDocumentLike,
  target: FullscreenTargetLike,
): Promise<boolean> {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return false;
    }
    await target.requestFullscreen();
    return true;
  } catch {
    return document.fullscreenElement !== null && document.fullscreenElement !== undefined;
  }
}
