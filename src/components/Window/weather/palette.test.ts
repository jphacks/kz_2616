import { describe, expect, it } from 'vitest';

import { hexToRgb, skyStops, timeBlend, toCssGradient } from './palette';

const DAY_TOP = hexToRgb('#3a8fe0');
const NIGHT_TOP = hexToRgb('#0b1535');

/** 2026-10-25 のローカル時刻（テストは時間帯の判定だけを見る） */
function at(hour: number, minute = 0): Date {
  return new Date(2026, 9, 25, hour, minute);
}

describe('timeBlend', () => {
  it('昼の時間帯は昼だけになる', () => {
    expect(timeBlend(at(12))).toEqual({ day: 1, dusk: 0, night: 0 });
  });

  it('真夜中は夜だけになる', () => {
    expect(timeBlend(at(0))).toEqual({ day: 0, dusk: 0, night: 1 });
  });

  it('日の出の時刻は夕焼けの配色が中心になる', () => {
    const blend = timeBlend(at(6), at(6).toISOString(), at(18).toISOString());
    expect(blend.dusk).toBeCloseTo(1);
  });

  it('どの時刻でも重みの合計は 1 になる', () => {
    for (let minute = 0; minute < 24 * 60; minute += 15) {
      const blend = timeBlend(at(Math.floor(minute / 60), minute % 60));
      expect(blend.day + blend.dusk + blend.night).toBeCloseTo(1);
    }
  });

  it('日の出・日没が不正な文字列のときは 6:00 と 18:00 とみなす', () => {
    expect(timeBlend(at(12), 'not-a-date', 'not-a-date')).toEqual(timeBlend(at(12)));
  });
});

describe('skyStops', () => {
  it('快晴の昼は、昼の上の色から始まる', () => {
    const [top] = skyStops('clear', { day: 1, dusk: 0, night: 0 });
    expect(top).toEqual(DAY_TOP);
  });

  it('夜は夜の上の色になる', () => {
    const [top] = skyStops('clear', { day: 0, dusk: 0, night: 1 });
    expect(top).toEqual(NIGHT_TOP);
  });

  it('時間帯が少しずつ変わると、色も少しずつ変わる（段階的に切り替わらない）', () => {
    const first = skyStops('clear', { day: 0.6, dusk: 0.2, night: 0.2 })[0];
    const second = skyStops('clear', { day: 0.59, dusk: 0.21, night: 0.2 })[0];
    for (let index = 0; index < 3; index += 1) {
      expect(Math.abs(first[index] - second[index])).toBeLessThan(2);
    }
  });
});

describe('toCssGradient', () => {
  it('縦方向の linear-gradient を返す', () => {
    const css = toCssGradient(skyStops('rain', { day: 1, dusk: 0, night: 0 }));
    expect(css).toMatch(
      /^linear-gradient\(180deg, rgb\(\d+ \d+ \d+\) 0%, rgb\(\d+ \d+ \d+\) 50%, rgb\(\d+ \d+ \d+\) 100%\)$/,
    );
  });
});
