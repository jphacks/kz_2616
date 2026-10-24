import { z } from "zod";

export const Point = z.object({
  x: z.number().min(0).max(1),
  y: z.number().min(0).max(1),
  t: z.number(), // ストローク開始からのms
});

export const Stroke = z.object({
  id: z.string(),
  points: z.array(Point).max(2000),
  width: z.number().min(0.001).max(0.05), // 窓の幅に対する比率
});

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

export type Point = z.infer<typeof Point>;
export type Stroke = z.infer<typeof Stroke>;
export type WindowEvent = z.infer<typeof WindowEvent>;
