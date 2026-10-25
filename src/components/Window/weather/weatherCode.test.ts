import { describe, expect, it } from 'vitest';

import { classifyWeather } from './weatherCode';

describe('classifyWeather', () => {
  it.each([
    [0, 'clear', 'light'],
    [2, 'partlyCloudy', 'light'],
    [3, 'cloudy', 'light'],
    [48, 'fog', 'light'],
    [61, 'rain', 'light'],
    [63, 'rain', 'heavy'],
    [82, 'rain', 'heavy'],
    [75, 'snow', 'light'],
    [86, 'snow', 'light'],
    [96, 'thunderstorm', 'heavy'],
  ] as const)('WMO %i は %s（%s）になる', (code, category, intensity) => {
    expect(classifyWeather(code)).toEqual({ category, intensity });
  });

  it('知らないコードは快晴として扱う', () => {
    expect(classifyWeather(100)).toEqual({ category: 'clear', intensity: 'light' });
  });
});
