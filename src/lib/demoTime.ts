/**
 * 撮影用に指定した時刻（"HH:mm"）を、今日の日付の Date にする。
 * 形式が正しくなければ null を返す（呼び出し側は実際の時刻を使う）。
 */
export function toDemoDate(today: Date, hhmm: string): Date | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!match) {
    return null;
  }
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) {
    return null;
  }
  const date = new Date(today);
  date.setHours(hours, minutes, 0, 0);
  return date;
}
