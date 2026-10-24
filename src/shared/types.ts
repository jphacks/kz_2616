// 天気の型。WeatherView(C)とuseWeather(C)、画面(リーダー)が共有する
export type WeatherState = {
  weatherCode: number; // Open-Meteoの天気コード(WMO)
  temperatureC: number; // 相手側の外気温
  isDay: boolean;
};
