export const CONFIG = {
  FOG_RECOVER_MS: 3 * 60 * 1000, // 曇りが戻るまで。デモ: 30 * 1000
  HAA_MUTE_MS: 3000,             // 「はー」検出後、自端末のマイクを止める時間
  WINDOW_ASPECT: 4 / 3,          // 窓の縦横比
} as const;
