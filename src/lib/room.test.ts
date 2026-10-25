import { describe, expect, it } from 'vitest';

import { isRoomFull } from './room';

const first = { key: 'a', joinedAt: 100 };
const second = { key: 'b', joinedAt: 200 };
const third = { key: 'c', joinedAt: 300 };

describe('isRoomFull', () => {
  it('定員以内の窓は満員ではない', () => {
    expect(isRoomFull([first], 'a', 2)).toBe(false);
    expect(isRoomFull([first, second], 'b', 2)).toBe(false);
  });

  it('後から入った 3 人目だけが満員になる（先の 2 人は外れない）', () => {
    const members = [first, second, third];
    expect(isRoomFull(members, 'a', 2)).toBe(false);
    expect(isRoomFull(members, 'b', 2)).toBe(false);
    expect(isRoomFull(members, 'c', 2)).toBe(true);
  });

  it('入室時刻が同じなら、キーの順で決める', () => {
    const members = [
      { key: 'x', joinedAt: 1 },
      { key: 'y', joinedAt: 1 },
      { key: 'z', joinedAt: 1 },
    ];
    expect(isRoomFull(members, 'z', 2)).toBe(true);
    expect(isRoomFull(members, 'x', 2)).toBe(false);
  });

  it('自分が一覧にないときは満員としない', () => {
    expect(isRoomFull([first, second], 'unknown', 2)).toBe(false);
  });
});
