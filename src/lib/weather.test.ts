import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildWeatherUrl, fetchWeather, parseWeatherResponse } from './weather';

const VALID_RESPONSE = {
  current: { time: '2026-10-24T17:30', weather_code: 55 },
  daily: {
    time: ['2026-10-24', '2026-10-25'],
    sunrise: ['2026-10-24T05:55', '2026-10-25T05:56'],
    sunset: ['2026-10-24T16:55', '2026-10-25T16:53'],
  },
};

describe('parseWeatherResponse', () => {
  it('Open-Meteo の応答を WeatherSnapshot に変換する（当日の日の出・日没を使う）', () => {
    expect(parseWeatherResponse(VALID_RESPONSE)).toEqual({
      weatherCode: 55,
      sunrise: '2026-10-24T05:55',
      sunset: '2026-10-24T16:55',
    });
  });

  it('current や daily がなければ例外を投げる', () => {
    expect(() => parseWeatherResponse({})).toThrow();
    expect(() => parseWeatherResponse(null)).toThrow();
  });

  it('数値であるべき項目が文字列なら例外を投げる', () => {
    const broken = {
      ...VALID_RESPONSE,
      current: { weather_code: '55' },
    };
    expect(() => parseWeatherResponse(broken)).toThrow();
  });
});

describe('buildWeatherUrl', () => {
  it('座標と取得項目をクエリに含める', () => {
    const url = new URL(buildWeatherUrl({ latitude: 35.68, longitude: 139.69 }));
    expect(url.origin + url.pathname).toBe('https://api.open-meteo.com/v1/forecast');
    expect(url.searchParams.get('latitude')).toBe('35.68');
    expect(url.searchParams.get('longitude')).toBe('139.69');
    expect(url.searchParams.get('current')).toBe('weather_code');
    expect(url.searchParams.get('daily')).toBe('sunrise,sunset');
    expect(url.searchParams.get('timezone')).toBe('auto');
  });
});

describe('fetchWeather', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('fetch の応答を変換して返す', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(VALID_RESPONSE), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const weather = await fetchWeather({ latitude: 35.68, longitude: 139.69 });

    expect(weather.weatherCode).toBe(55);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('HTTP エラーなら例外を投げる', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 500 })));

    await expect(fetchWeather({ latitude: 0, longitude: 0 })).rejects.toThrow('500');
  });
});
