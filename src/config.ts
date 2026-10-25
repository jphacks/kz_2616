export const CONFIG = {
  // 曇りが戻って文字が消えるまでの時間(ms)
  FOG_RECOVER_MS: 3 * 60 * 1000, // 本番: 3分
  // FOG_RECOVER_MS: 30 * 1000,  // デモ: 30秒

  // 「はー」検出後、自端末のマイクを無効にする時間(ms)
  HAA_MUTE_MS: 3000,

  // 「はー」を検出してから、窓が曇りきるまでの時間(ms)
  BREATH_FOG_FADE_MS: 1000,

  // 「はー」で曇ったあと、曇りが透明に戻るまでの時間(ms)
  BREATH_FOG_FADE_OUT_MS: 60 * 1000,

  // 窓の縦横比
  WINDOW_ASPECT: 4 / 3,

  // 室温スライダーと窓枠の色が対応する範囲(℃)
  ROOM_TEMPERATURE_MIN_C: -10,
  ROOM_TEMPERATURE_MAX_C: 35,

  // 位置情報が取れないときに使う座標(東京)
  FALLBACK_LOCATION: { latitude: 35.68, longitude: 139.69 },
} as const;
