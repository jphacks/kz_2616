/** 背景の見た目で分けた天気の種類。WMO weather code をここに変換してから描く */
export type WeatherCategory =
  'clear' | 'partlyCloudy' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'thunderstorm';

/** 雨の強さ。粒の数に使う */
export type Intensity = 'light' | 'heavy';

export interface WeatherLook {
  category: WeatherCategory;
  intensity: Intensity;
}

/** 小雨として扱う WMO weather code（それ以外の雨は強い雨） */
const LIGHT_RAIN_CODES = new Set([51, 53, 56, 61, 80]);

/**
 * WMO weather code を背景の分類に変換する。
 * 知らないコードは快晴として扱う（窓が真っ暗になるのを避けるため）。
 */
export function classifyWeather(weatherCode: number): WeatherLook {
  if (weatherCode === 0) {
    return { category: 'clear', intensity: 'light' };
  }
  if (weatherCode === 1 || weatherCode === 2) {
    return { category: 'partlyCloudy', intensity: 'light' };
  }
  if (weatherCode === 3) {
    return { category: 'cloudy', intensity: 'light' };
  }
  if (weatherCode === 45 || weatherCode === 48) {
    return { category: 'fog', intensity: 'light' };
  }
  // 霧雨・雨・着氷性の雨・にわか雨
  if ((weatherCode >= 51 && weatherCode <= 67) || (weatherCode >= 80 && weatherCode <= 82)) {
    return {
      category: 'rain',
      intensity: LIGHT_RAIN_CODES.has(weatherCode) ? 'light' : 'heavy',
    };
  }
  // 雪・にわか雪
  if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode === 85 || weatherCode === 86) {
    return { category: 'snow', intensity: 'light' };
  }
  if (weatherCode >= 95 && weatherCode <= 99) {
    return { category: 'thunderstorm', intensity: 'heavy' };
  }
  return { category: 'clear', intensity: 'light' };
}
