let sharedContext: AudioContext | null = null;

/**
 * 音声処理の AudioContext を 1 つだけ作って共有する。
 * iOS では、ユーザーの操作（タップ）の中で再開しないと音が流れないため、
 * 作成・再開は unlockAudio をタップの処理の中で呼ぶ。
 */
export function getAudioContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new AudioContext();
  }
  return sharedContext;
}

/** タップなどのユーザー操作の中で呼び、AudioContext を動かせる状態にする */
export function unlockAudio(): void {
  void getAudioContext().resume();
}
