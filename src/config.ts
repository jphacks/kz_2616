import { selectConfig } from '@/lib/demoConfig';

/** 通常の設定値（本番・発表時の値） */
const BASE_CONFIG = {
  // 2 人をつなぐ合言葉の上限（文字数）
  PASSPHRASE_MAX_LENGTH: 32,

  // 同じ合言葉で入れる窓の数。これを超えた後から入る窓は満員になる
  ROOM_MAX_MEMBERS: 2,

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

  // 位置情報が取れないときに使う座標(東京)
  FALLBACK_LOCATION: { latitude: 35.68, longitude: 139.69 },
} as const;

/**
 * 会場のデモ用の値。ビルド時に NEXT_PUBLIC_DEMO_MODE=1 を付けたときだけ、通常の値の上に重なる。
 * 曇りが戻るのを待つ時間を短くして、何度でも見せられるようにする。
 */
const DEMO_OVERRIDES: Partial<typeof BASE_CONFIG> = {
  // 息のあと、曇りが透明に戻るまで（通常 60 秒）
  BREATH_FOG_FADE_OUT_MS: 30 * 1000,
  // 息のあと、水滴が垂れる時間（通常 20 秒）
  DRIP_ACTIVE_MS: 15 * 1000,
};

// NEXT_PUBLIC_ の変数は、ビルド時に値が埋め込まれるように直接書く
export const CONFIG = selectConfig(
  BASE_CONFIG,
  DEMO_OVERRIDES,
  process.env.NEXT_PUBLIC_DEMO_MODE === '1',
);
