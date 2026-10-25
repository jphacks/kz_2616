import { describe, expect, it } from 'vitest';

import { toDemoDate } from './demoTime';

describe('toDemoDate', () => {
  const today = new Date(2026, 9, 25, 9, 15, 30);

  it('今日の日付のまま、指定した時分にする', () => {
    const result = toDemoDate(today, '17:45');

    expect(result?.getFullYear()).toBe(2026);
    expect(result?.getMonth()).toBe(9);
    expect(result?.getDate()).toBe(25);
    expect(result?.getHours()).toBe(17);
    expect(result?.getMinutes()).toBe(45);
    expect(result?.getSeconds()).toBe(0);
  });

  it('形式が不正なら null を返す', () => {
    expect(toDemoDate(today, '')).toBeNull();
    expect(toDemoDate(today, '1745')).toBeNull();
    expect(toDemoDate(today, '24:00')).toBeNull();
    expect(toDemoDate(today, '12:60')).toBeNull();
  });
});
