# src/shared/ — 全員の「契約」(担当: リーダー)

ここは全員のコードが依存する場所。**リーダー以外は編集しない。** 変更したいときはリーダーに依頼する。

## 置くもの
- `schema.ts` : Zodスキーマと型(`Point` / `Stroke` / `WindowEvent`)
- `config.ts` : 設定値(`CONFIG`)
- `types.ts` : 天気の型(`WeatherState`)など、複数の担当が使う型

## 守ること
- スキーマを変えると全員のコードが壊れる。変更は最小限にし、変えたら全員に即共有する
- 型は`z.infer<typeof ...>`で作り、スキーマと型を二重管理しない
- `config.ts`の値は`as const`で固定する

## 契約の内容

```ts
// schema.ts
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
```

```ts
// config.ts
export const CONFIG = {
  FOG_RECOVER_MS: 3 * 60 * 1000, // 曇りが戻るまで。デモ: 30 * 1000
  HAA_MUTE_MS: 3000,             // 「はー」検出後、自端末のマイクを止める時間
  WINDOW_ASPECT: 4 / 3,          // 窓の縦横比
} as const;
```

```ts
// types.ts
export type WeatherState = {
  weatherCode: number;  // Open-Meteoの天気コード(WMO)
  temperatureC: number; // 相手側の外気温
  isDay: boolean;
};
```
