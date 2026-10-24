import { z } from "zod";

// 座標は0〜1に正規化する。画面サイズが違う端末でも同じ位置に出すため
export const Point = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  t: z.number(), // ストローク開始からのms
});

export const Stroke = z.object({
  id: z.string(),
  // 通信量の上限。受信側でも弾けるように必ず制限をかける
  points: z.array(Point).max(2000),
  width: z.number().min(0.001).max(0.05), // 窓の幅に対する比率
});

// 全イベントがsourceId(発信した端末のID)を持つ。自分の発信を無視するため
export const WindowEvent = z.discriminatedUnion("type", [
  z.object({ type: z.literal("stroke"), stroke: Stroke, sourceId: z.string() }),
  z.object({
    type: z.literal("fog"),
    level: z.number().min(0).max(1),
    sourceId: z.string(),
    at: z.number(),
  }),
  z.object({ type: z.literal("presence"), online: z.boolean(), sourceId: z.string() }),
]);

// 型はスキーマから作る。スキーマと型を二重管理しないため
export type Point = z.infer<typeof Point>;
export type Stroke = z.infer<typeof Stroke>;
export type WindowEvent = z.infer<typeof WindowEvent>;
