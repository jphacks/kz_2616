import { CONFIG } from '@/config';

import type { WeatherCategory } from './weatherCode';

export type RGB = readonly [number, number, number];

/** 上・中・下の3色。空のグラデーションは、この3色で描く */
export type SkyStops = readonly [RGB, RGB, RGB];

/** 昼・夕方（朝焼け・夕焼け）・夜の重み。合計は 1 */
export interface TimeBlend {
  day: number;
  dusk: number;
  night: number;
}

/** 日の出・日没が取れないときに仮定する時刻(時) */
const FALLBACK_SUNRISE_HOUR = 6;
const FALLBACK_SUNSET_HOUR = 18;

interface CategoryPalette {
  /** 昼の上・下 */
  day: readonly [string, string];
  /** 夜の上・下 */
  night: readonly [string, string];
  /** 夕焼けの上・中・下。省略時は昼と夜の中間色を使う */
  dusk?: readonly [string, string, string];
}

// 夕焼けの配色は快晴だけに用意し、他の天気は昼と夜の中間で代用する
const CLEAR_DUSK = ['#3b5a9d', '#e8836b', '#f6c177'] as const;

const PALETTES: Record<WeatherCategory, CategoryPalette> = {
  clear: { day: ['#3a8fe0', '#8cc8f5'], night: ['#0b1535', '#243b6b'], dusk: CLEAR_DUSK },
  partlyCloudy: { day: ['#3a8fe0', '#8cc8f5'], night: ['#0b1535', '#243b6b'], dusk: CLEAR_DUSK },
  cloudy: { day: ['#7d8fa3', '#b4c0cd'], night: ['#1f2a3a', '#2f3d52'] },
  fog: { day: ['#aeb7bf', '#c9d0d6'], night: ['#2a3340', '#3a4553'] },
  rain: { day: ['#54606e', '#8793a1'], night: ['#1e2530', '#343e4c'] },
  snow: { day: ['#8a9bb0', '#c3cfdb'], night: ['#232d3b', '#37445a'] },
  thunderstorm: { day: ['#2c303a', '#4b4f5c'], night: ['#15181f', '#262a33'] },
};

export function hexToRgb(hex: string): RGB {
  const value = parseInt(hex.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

/** 色を重みつきで足し合わせる。重みは合計 1 を想定する */
function blendRgb(colors: readonly RGB[], weights: readonly number[]): RGB {
  const channel = (index: 0 | 1 | 2) =>
    colors.reduce((sum, color, i) => sum + color[index] * (weights[i] ?? 0), 0);
  return [channel(0), channel(1), channel(2)];
}

/** 2色のグラデーションを、上・中・下の3色にする */
function stopsFromTwo([top, bottom]: readonly [string, string]): SkyStops {
  const topRgb = hexToRgb(top);
  const bottomRgb = hexToRgb(bottom);
  return [topRgb, blendRgb([topRgb, bottomRgb], [0.5, 0.5]), bottomRgb];
}

function stopsFromThree([top, middle, bottom]: readonly [string, string, string]): SkyStops {
  return [hexToRgb(top), hexToRgb(middle), hexToRgb(bottom)];
}

function parseTime(value: string | undefined): number | undefined {
  if (!value) {
    return undefined;
  }
  const time = Date.parse(value);
  return Number.isNaN(time) ? undefined : time;
}

/** now と同じ日の、指定した時(0〜24)のミリ秒 */
function atHour(now: Date, hour: number): number {
  const date = new Date(now);
  date.setHours(hour, 0, 0, 0);
  return date.getTime();
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
}

/**
 * 今の時刻が、昼・夕方・夜のどれにどれくらい近いかを返す。
 * 日の出・日没の前後 WEATHER_TWILIGHT_MS の間は、色を少しずつ混ぜて切り替える（段階的に変えない）。
 * 日の出・日没が取れないときは、6:00 と 18:00 とみなす。
 */
export function timeBlend(now: Date, sunrise?: string, sunset?: string): TimeBlend {
  const time = now.getTime();
  const sunriseTime = parseTime(sunrise) ?? atHour(now, FALLBACK_SUNRISE_HOUR);
  const sunsetTime = parseTime(sunset) ?? atHour(now, FALLBACK_SUNSET_HOUR);
  const window = CONFIG.WEATHER_TWILIGHT_MS;

  // 日の出の前後で明るくなり、日没の前後で暗くなる
  const daylight = Math.min(
    Math.max(
      smoothstep(sunriseTime - window, sunriseTime + window, time) -
        smoothstep(sunsetTime - window, sunsetTime + window, time),
      0,
    ),
    1,
  );
  // 日の出・日没ちょうどで 1、それ以外は窓の外で 0
  const dusk = Math.max(
    0,
    1 - Math.abs(time - sunriseTime) / window,
    1 - Math.abs(time - sunsetTime) / window,
  );
  const day = Math.min(Math.max(daylight - dusk, 0), 1);
  const night = Math.max(0, 1 - day - dusk);

  const total = day + dusk + night;
  return { day: day / total, dusk: dusk / total, night: night / total };
}

/** 天気の分類と時間帯から、空の上・中・下の色を決める */
export function skyStops(category: WeatherCategory, blend: TimeBlend): SkyStops {
  const palette = PALETTES[category];
  const day = stopsFromTwo(palette.day);
  const night = stopsFromTwo(palette.night);
  const dusk = palette.dusk ? stopsFromThree(palette.dusk) : mixStops(day, night);

  const weights = [blend.day, blend.dusk, blend.night];
  const stopAt = (index: 0 | 1 | 2): RGB =>
    blendRgb([day[index], dusk[index], night[index]], weights);
  return [stopAt(0), stopAt(1), stopAt(2)];
}

/** 昼と夜の中間色（夕焼けの配色がない天気で使う） */
function mixStops(day: SkyStops, night: SkyStops): SkyStops {
  const mix = (index: 0 | 1 | 2) => blendRgb([day[index], night[index]], [0.5, 0.5]);
  return [mix(0), mix(1), mix(2)];
}

function cssColor([red, green, blue]: RGB): string {
  return `rgb(${Math.round(red)} ${Math.round(green)} ${Math.round(blue)})`;
}

/** 窓の背景に敷く CSS のグラデーション */
export function toCssGradient([top, middle, bottom]: SkyStops): string {
  return `linear-gradient(180deg, ${cssColor(top)} 0%, ${cssColor(middle)} 50%, ${cssColor(bottom)} 100%)`;
}
