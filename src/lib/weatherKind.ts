/** 描画に使う天気の大分類 */
export type WeatherKind = 'clear' | 'cloudy' | 'rain' | 'snow';

/** デモ用に、大分類ごとの代表的な WMO weather code */
export const WEATHER_KIND_CODES: Record<WeatherKind, number> = {
  clear: 0,
  cloudy: 3,
  rain: 61,
  snow: 71,
};

/**
 * WMO weather code を大分類に変換する。
 * 霧は曇りとして扱い、雷雨は雨として扱う。
 */
export function classifyWeatherCode(weatherCode: number): WeatherKind {
  if (weatherCode === 0 || weatherCode === 1) {
    return 'clear';
  }
  if (weatherCode === 2 || weatherCode === 3 || weatherCode === 45 || weatherCode === 48) {
    return 'cloudy';
  }
  // 霧雨・雨・着氷性の雨・にわか雨・雷雨
  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
    return 'rain';
  }
  if (weatherCode >= 95 && weatherCode <= 99) {
    return 'rain';
  }
  // 雪・にわか雪
  if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) {
    return 'snow';
  }
  return 'clear';
}
