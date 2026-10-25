import { describe, expect, it } from 'vitest';

import { classifyWeatherCode } from './weatherKind';

describe('classifyWeatherCode', () => {
  it('快晴・晴れは clear', () => {
    expect(classifyWeatherCode(0)).toBe('clear');
    expect(classifyWeatherCode(1)).toBe('clear');
  });

  it('曇り・霧は cloudy', () => {
    expect(classifyWeatherCode(2)).toBe('cloudy');
    expect(classifyWeatherCode(3)).toBe('cloudy');
    expect(classifyWeatherCode(45)).toBe('cloudy');
    expect(classifyWeatherCode(48)).toBe('cloudy');
  });

  it('霧雨・雨・にわか雨・雷雨は rain', () => {
    expect(classifyWeatherCode(51)).toBe('rain');
    expect(classifyWeatherCode(65)).toBe('rain');
    expect(classifyWeatherCode(81)).toBe('rain');
    expect(classifyWeatherCode(95)).toBe('rain');
    expect(classifyWeatherCode(99)).toBe('rain');
  });

  it('雪・にわか雪は snow', () => {
    expect(classifyWeatherCode(71)).toBe('snow');
    expect(classifyWeatherCode(77)).toBe('snow');
    expect(classifyWeatherCode(86)).toBe('snow');
  });

  it('未定義のコードは clear として扱う', () => {
    expect(classifyWeatherCode(4)).toBe('clear');
  });
});
