export const CONFIG = {
  // 「はー」検出後、自端末のマイクを無効にする時間(ms)
  HAA_MUTE_MS: 3000,

  // 「はー」を検出してから、窓が曇りきるまでの時間(ms)
  BREATH_FOG_FADE_MS: 1000,

  // 「はー」で曇ったあと、曇りが透明に戻るまでの時間(ms)
  BREATH_FOG_FADE_OUT_MS: 60 * 1000,

  // 天気が変わったときの、背景のクロスフェード時間(ms)
  WEATHER_CROSSFADE_MS: 1500,

  // 日の出・日没の前後、空の色を夕焼けの配色へ近づける幅(ms)
  WEATHER_TWILIGHT_MS: 45 * 60 * 1000,

  // 「はー」で曇ったあと、水滴が垂れる時間(ms)。曇りが濃い間だけ垂れる
  DRIP_ACTIVE_MS: 20 * 1000,

  // 水滴が落ちる間隔の範囲(ms)
  DRIP_INTERVAL_MIN_MS: 2000,
  DRIP_INTERVAL_MAX_MS: 5000,

  // 水滴の速さ(px/s)と、跡の長さの範囲(px)
  DRIP_SPEED_PX_PER_SEC: 30,
  DRIP_LENGTH_MIN_PX: 20,
  DRIP_LENGTH_MAX_PX: 200,

  // 雷が落ちる間隔の範囲(ms)
  LIGHTNING_MIN_MS: 5000,
  LIGHTNING_MAX_MS: 12000,

  // 窓の縦横比
  WINDOW_ASPECT: 4 / 3,

  // 室温スライダーと窓枠の色が対応する範囲(℃)
  ROOM_TEMPERATURE_MIN_C: -10,
  ROOM_TEMPERATURE_MAX_C: 35,

  // 位置情報が取れないときに使う座標(東京)
  FALLBACK_LOCATION: { latitude: 35.68, longitude: 139.69 },
} as const;
