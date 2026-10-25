/**
 * 設定値を選ぶ。デモ用の値は、通常の値の上に重ねて使う。
 * デモでないときは、通常の値をそのまま返す。
 */
export function selectConfig<T extends object>(
  base: T,
  demoOverrides: Partial<T>,
  isDemo: boolean,
): T {
  return isDemo ? { ...base, ...demoOverrides } : base;
}
