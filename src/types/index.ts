/** 手書きの1点。座標は窓の描画領域内のピクセル値 */
export interface Point {
  x: number;
  y: number;
  pressure?: number;
  /** 1 画の始まりからの時間(ms)。相手の線を書いた速さで再生するために使う */
  t?: number;
  /** 拭く半径(px)。省略時はなぞる速さから決める（水滴など、太さを決めて送る場合に使う） */
  r?: number;
}

/** Open-Meteo から取得する天気情報 */
export interface WeatherSnapshot {
  /** WMO weather code */
  weatherCode: number;
  /** 気温(℃) */
  temperatureC: number;
  /** 日の出時刻 (ISO 8601) */
  sunrise: string;
  /** 日没時刻 (ISO 8601) */
  sunset: string;
}

/** 手書きの1画。点列から輪郭を作って描画する */
export interface Stroke {
  points: Point[];
  /** 筆圧が取れない入力(マウス・指)で、速度から筆圧を推定するか */
  simulatePressure: boolean;
}

/** 同期チャンネルの接続状態 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/** デモ用の気象情報。'actual' は実際の天気 */
export type WeatherOverride = 'actual' | 'clear' | 'cloudy' | 'rain' | 'snow';

/** マイクの感度（高いほど小さな息でも反応する） */
export type HaaSensitivity = 'high' | 'normal' | 'low';
