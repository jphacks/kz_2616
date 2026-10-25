import { z } from 'zod';

/** 1 点（座標は窓の大きさに対する割合 0〜1。端末の画面の大きさに依らないため。筆圧はペンのみ） */
const PointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  pressure: z.number().finite().optional(),
});

/** 1 画分の筆跡。受信側はこの点をなぞって曇りを拭く */
export const StrokeEventSchema = z.object({
  type: z.literal('stroke'),
  // 極端に長い入力を弾く（1 画の点数の上限）
  points: z.array(PointSchema).max(10000),
  timestamp: z.number().finite(),
});

/** 息（「はー」）を検出したことを知らせる */
export const FogEventSchema = z.object({
  type: z.literal('fog'),
  timestamp: z.number().finite(),
});

export const SyncEventSchema = z.discriminatedUnion('type', [StrokeEventSchema, FogEventSchema]);

export type StrokeEvent = z.infer<typeof StrokeEventSchema>;
export type FogEvent = z.infer<typeof FogEventSchema>;
export type SyncEvent = z.infer<typeof SyncEventSchema>;

/**
 * 受信した値を検証する。形式が正しくなければ null を返す（例外は投げない）。
 * 受信データは相手の端末から来るため、信用せずに必ず検証する。
 */
export function parseSyncEvent(value: unknown): SyncEvent | null {
  const result = SyncEventSchema.safeParse(value);
  return result.success ? result.data : null;
}
