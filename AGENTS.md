<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

## プロジェクト概要

「窓」をモチーフにしたリアルタイムコミュニケーション Web アプリ。
離れた場所にいる 2 人が、曇った窓ガラスに指で文字を書くように、筆跡を共有し合う。

### コンセプト

- 窓に息を吹きかけて「はー」と曇らせる（マイクで検出）
- 曇りを指でなぞると、拭き取られて文字が書ける
- 曇りは時間をかけて透明に戻り、文字も見えなくなる
- 窓の向こうには、相手側の天気が映る（天気の種類と日の出・日没のみ共有）

---

## 技術スタック

| 領域             | 技術                                 | 用途                         |
| ---------------- | ------------------------------------ | ---------------------------- |
| 言語             | TypeScript (strict)                  | 型安全性の確保               |
| フレームワーク   | Next.js (App Router) + React         | Web アプリ                   |
| リアルタイム同期 | Supabase Realtime (Broadcast)        | 筆跡・息・天気の低遅延同期   |
| 同期の接続       | 合言葉（お互いに同じ合言葉を入力）   | 2 人を同じチャンネルへ       |
| 入力検証         | Zod                                  | 受信イベントの parse 検証    |
| 天気データ       | Open-Meteo API                       | 天気コード、日の出・日没     |
| 位置情報         | Geolocation API                      | 自分側の天気の取得           |
| 天気描画         | PixiJS                               | 雨・雪・雲・霧・星・稲光     |
| 曇り・手書き     | Canvas 2D + perfect-freehand         | 曇りの拭き取り、滑らかな筆跡 |
| 入力             | Pointer Events                       | 指・マウス・ペン対応         |
| 「はー」検出     | Web Audio API (AnalyserNode)         | 音量・スペクトルで判定       |
| 常時点灯         | Screen Wake Lock API                 | 画面消灯防止                 |
| 全画面           | Fullscreen API                       | 窓を画面いっぱいに（予定）   |
| 状態管理         | Zustand                              | 設定値と接続状態、相手の天気 |
| ホスティング     | Vercel                               | HTTPS 必須（予定）           |
| 品質管理         | ESLint, Prettier, Vitest, Playwright | コード品質担保               |

Bluesky 認証・PWA 化は今回は行わない（必要になったら決める）。

---

## ディレクトリ構成（現状）

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # 入口（RoomGate を表示）
│   ├── globals.css
│   └── test/weather/            # 天気背景の確認用の画面（開発用）
├── components/
│   ├── Window/
│   │   ├── WindowFrame.tsx      # 窓枠（画面いっぱい。端の影が枠になる）
│   │   ├── WindowScene.tsx      # 窓の組み立て（レイヤーと入力、同期）
│   │   ├── WeatherOverlay.tsx   # 天気の背景（CSS の空 + PixiJS）
│   │   ├── weather/             # 天気の描画（palette / SkyScene / effects/）
│   │   ├── FogLayer.tsx         # 曇り（Canvas）
│   │   └── DrawingLayer.tsx     # 手書き（Canvas）
│   ├── Room/                    # 入室画面（合言葉）と、入室後の切り替え
│   ├── ui/SyncStatus.tsx        # 接続状態の表示（入室画面と窓で共通）
│   ├── HaaDetector/             # 「はー」の検出と、マイクのミュート
│   └── SettingsMenu/            # デモ用の設定（天気の切り替えなど）
├── hooks/
│   ├── useFogCanvas.ts          # 曇りの拭き取り・息での曇り
│   ├── useDrawing.ts            # 手書き
│   ├── useWindowInput.ts        # 指・マウス・ペンの入力
│   ├── useHaaDetection.ts       # 「はー」の検出
│   ├── useSupabaseSync.ts       # 同期（筆跡・息・天気の送受信）
│   ├── useWaterDrips.ts         # 水滴（なぞった場所から垂れる）
│   ├── useWeather.ts            # 天気の取得
│   └── useCurrentCoordinates.ts # 位置情報
├── lib/                         # 純粋な処理（天気 API、描画、曇り、再生など）
├── schemas/events.ts            # 同期イベントの Zod スキーマ
├── stores/useAppStore.ts        # Zustand store
├── types/index.ts               # 型定義
└── config.ts                    # 設定パラメータ
e2e/                             # Playwright の E2E
```

---

## 設定パラメータ

値は `src/config.ts` が正本。ここには主要なものだけを載せる。

```typescript
export const CONFIG = {
  HAA_MUTE_MS: 3000, // 「はー」検出後、マイクを無効にする時間
  BREATH_FOG_FADE_MS: 1000, // 「はー」で窓が曇りきるまで
  BREATH_FOG_FADE_OUT_MS: 60_000, // 曇りが透明に戻るまで
  WEATHER_CROSSFADE_MS: 1500, // 天気が変わるときのクロスフェード
  WEATHER_TWILIGHT_MS: 2_700_000, // 日の出・日没の前後の夕焼けの幅（45 分）
  DRIP_ACTIVE_MS: 20_000, // 息のあと、水滴が垂れる時間
  // ほか: DRIP_*（水滴の間隔・速さ・長さ）、LIGHTNING_*（稲光の間隔）、FALLBACK_LOCATION
} as const;
```

---

## 設計方針

### データの扱い

- **メッセージは保存しない**: リレーのみ。曇りが戻ると文字も見えなくなる
- **相手と共有するのは天気の値だけ**: 天気の種類、日の出・日没。座標や気温は送らない
- **筆跡・息・音声は保存しない**: 「はー」の検出は端末の中だけで行う

### 窓の形

- 窓は画面いっぱいに広げる（4:3 の枠は使わない）。画面の端の影を窓枠に見立てる

### 描画レイヤー（下から）

1. **天気**（`WeatherOverlay`）: 空の色（CSS）と、雲・雨・雪などの粒子（PixiJS）
2. **手書き**（`DrawingLayer`）: 透明なインク。見えるのは拭き跡だけ
3. **曇り**（`FogLayer`）: 不透明な曇り。拭くと下の天気が見える。不透明度は 0.96

### 同期イベント（Zod で検証）

受信したデータは、必ず `parseSyncEvent` で検証してから使う。

| type      | 内容                                                                |
| --------- | ------------------------------------------------------------------- |
| `stroke`  | 1 画分の点列（割合 0〜1、時刻 `t`、太さ `r`）。水滴の跡もこれで送る |
| `fog`     | 息を検出したことだけを知らせる                                      |
| `weather` | 天気コード、日の出、日没                                            |

### 合言葉によるペアリング

- 2 人が同じ合言葉を入力すると、同じチャンネルに入る
- 合言葉を cyrb53 で数値にまとめ、`window-` を付けたチャンネル名にする（`syncChannelName`）。合言葉そのものはチャンネル名に出さない

---

## 開発ステップ

| 段階 | 内容                                 | 状態                       |
| ---- | ------------------------------------ | -------------------------- |
| 1    | 1 台で動く窓（天気、曇り、手書き）   | 完了                       |
| 2    | 「はー」で曇らせる                   | 完了                       |
| 3    | 2 台の同期（筆跡・息・水滴・天気）   | 完了（合言葉の接続は未了） |
| 4    | 合言葉による接続（入室とチャンネル） | 完了                       |
| 5    | 常時点灯、全画面、デプロイ、デモ調整 | 未着手                     |

---

## コーディング規約

### TypeScript

- `strict: true`。`any` は使わず、必要なら `unknown`
- 型は `src/types/index.ts` に集約する

### React

- 関数コンポーネント + Hooks
- Props 型は `interface` で定義
- イベントハンドラは `handle` プレフィックス（例: `handlePointerDown`）

### 命名規則

- コンポーネント: PascalCase（例: `FogLayer`）
- 関数・変数: camelCase（例: `useFogCanvas`）
- 定数: UPPER_SNAKE_CASE（例: `HAA_MUTE_MS`）
- ファイル: コンポーネントは PascalCase、その他は camelCase

### コメントとコミット

- コメントは日本語で、「なぜそうするか」を短く書く
- コミットメッセージは `Add` / `Fix` / `Update` / `Remove` / `Refactor` + 内容

---

## 環境変数

```env
# .env.local（Git に入れない）
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_publishable_key
```

未設定のときは同期を行わず、1 台で動く。

---

## コマンド

```bash
npm run dev          # 開発サーバー
npm run type-check   # 型チェック
npm run lint         # Lint
npm run test         # 単体テスト（Vitest）
npm run test:e2e     # E2E（Playwright）
npm run build        # ビルド
```

---

## 注意事項

- HTTPS が必須（マイク・位置情報のため）→ Vercel でホスティング（予定）
- 窓の向きは固定しない（縦横どちらでも使える）
- 通知機能は今回対応しない
- 室温は使わない（スライダーは削除済み）

---

## タスク

### 完了

| ID         | 内容                                                    |
| ---------- | ------------------------------------------------------- |
| T0         | 土台（Next.js、Lint/Test/Build、config・型・Zustand）   |
| T1-2〜T1-5 | 天気取得、天気の背景、曇り、手書き                      |
| T2-1〜T2-3 | 「はー」の検出、ミュート、息で曇らせる                  |
| T3-1〜T3-3 | Supabase 接続、イベント検証、筆跡・息・水滴・天気の共有 |

### Phase A: 1 台での仕上げ

| ID  | タスク                                         | 完了条件                   |
| --- | ---------------------------------------------- | -------------------------- |
| A-1 | 水滴の見た目を 2 台で確認（太さ・長さ）        | 相手側でも同じ見た目で出る |
| A-2 | Playwright の E2E を実行し、通らないものを修正 | `npm run test:e2e` が通る  |

### Phase B: 合言葉による接続

| ID     | タスク                                             | 完了条件                            |
| ------ | -------------------------------------------------- | ----------------------------------- |
| B-1 ✅ | 入室画面を作る（合言葉の入力、入室ボタン）         | 合言葉を入力して窓に入れる          |
| B-2 ✅ | 合言葉から同期チャンネルを決める（固定名をやめる） | 合言葉が一致した 2 台だけがつながる |
| B-3 ✅ | 接続状態の表示を入室画面と窓で合わせる             | 接続中・同期中・失敗が正しく出る    |
| B-4    | 相手の天気を窓に映す（接続時と天気の変化時に送る） | 相手の天気の背景が窓に映る          |

### Phase C: 仕上げ・発表準備

| ID     | タスク                                                 | 完了条件                     |
| ------ | ------------------------------------------------------ | ---------------------------- |
| C-1 ✅ | 画面の常時点灯（Screen Wake Lock API、失敗しても動く） | 操作なしで画面が消えない     |
| C-2    | 全画面表示（Fullscreen API、ボタン）                   | ボタンで全画面になる         |
| C-3    | Vercel にデプロイ（HTTPS、環境変数）                   | 公開 URL で 2 台が接続できる |
| C-4    | デモ用の設定（会場向けの待ち時間・水滴）               | 会場の設定で動く             |
