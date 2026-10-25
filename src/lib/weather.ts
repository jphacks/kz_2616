import type { WeatherSnapshot } from '@/types';

const OPEN_METEO_ENDPOINT = 'https://api.open-meteo.com/v1/forecast';

export interface Coordinates {
  latitude: number;
  longitude: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Open-Meteo の応答を検証し、アプリ内の型に変換する。形式が違えば例外を投げる */
export function parseWeatherResponse(json: unknown): WeatherSnapshot {
  if (!isRecord(json) || !isRecord(json.current) || !isRecord(json.daily)) {
    throw new Error('Open-Meteo の応答形式が不正です');
  }

  const { weather_code } = json.current;
  const { sunrise, sunset } = json.daily;

  if (
    typeof weather_code !== 'number' ||
    !Array.isArray(sunrise) ||
    !Array.isArray(sunset) ||
    typeof sunrise[0] !== 'string' ||
    typeof sunset[0] !== 'string'
  ) {
    throw new Error('Open-Meteo の応答に必要な項目がありません');
  }

  return {
    weatherCode: weather_code,
    sunrise: sunrise[0],
    sunset: sunset[0],
  };
}

/** 現在の天気・気温と、当日の日の出・日没を取得するURLを組み立てる */
export function buildWeatherUrl({ latitude, longitude }: Coordinates): string {
  const url = new URL(OPEN_METEO_ENDPOINT);
  url.searchParams.set('latitude', String(latitude));
  url.searchParams.set('longitude', String(longitude));
  url.searchParams.set('current', 'weather_code');
  url.searchParams.set('daily', 'sunrise,sunset');
  url.searchParams.set('timezone', 'auto');
  return url.toString();
}

export async function fetchWeather(
  coordinates: Coordinates,
  signal?: AbortSignal,
): Promise<WeatherSnapshot> {
  const response = await fetch(buildWeatherUrl(coordinates), { signal });
  if (!response.ok) {
    throw new Error(`Open-Meteo の取得に失敗しました (${response.status})`);
  }
  const json: unknown = await response.json();
  return parseWeatherResponse(json);
}
