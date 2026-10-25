/** 部屋にいる 1 つの窓。入室した時刻で順番を決める */
export interface RoomMember {
  key: string;
  joinedAt: number;
}

/**
 * 自分が定員の外かどうかを返す。
 * 入室の早い順に定員まで残し、後から入った窓は満員になる（先に入っていた 2 人は外れない）。
 */
export function isRoomFull(members: RoomMember[], selfKey: string, maxMembers: number): boolean {
  const ordered = [...members].sort(
    (a, b) => a.joinedAt - b.joinedAt || a.key.localeCompare(b.key),
  );
  const rank = ordered.findIndex((member) => member.key === selfKey);
  return rank >= maxMembers;
}
