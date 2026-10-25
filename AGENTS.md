<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

## プロジェクト概要

「窓」をモチーフにしたリアルタイムコミュニケーションWebアプリ。
離れた場所にいる2人が、曇った窓ガラスに指で文字を書くように、筆跡を共有し合う。

### コンセプト

- 曇りガラスに「はー」と息を吹きかけて曇らせる
- 指で文字やイラストを描く
- 時間が経つと曇りが戻り、文字が消える
- 相手の窓には相手側の天気が映る

---

## 技術スタック

| 領域 | 技術 | 用途 |
|------|------|------|
| 言語 | TypeScript (strict) | 型安全性の確保 |
| フレームワーク | Next.js (App Router) + React | Webアプリ + PWA |
| PWA | Serwist | manifest、ホーム画面追加 |
| 認証 | Bluesky OAuth (@atproto/oauth-client-browser) | ハンドルで相手を特定 |
| リアルタイム同期 | Supabase Realtime (Broadcast) | 筆跡の低遅延同期 |
| 同期の認可 | Supabase Realtime Authorization (RLS) | ペア限定のチャンネル |
| 入力検証 | Zod | 受信イベントのparse検証 |
| 天気データ | Open-Meteo API | 天気コード、気温、日の出・日没 |
| 位置情報 | Geolocation API | 相手側の天気取得 |
| 天気描画 | PixiJS | 雨・雪・雲の粒子表現 |
| 曇り・手書き | Canvas 2D + perfect-freehand | 曇りの拭き取り、滑らかな筆跡 |
| 入力 | Pointer Events | 指・マウス・ペン対応 |
| 「はー」検出 | Web Audio API (AnalyserNode) | 音量・スペクトルで判定 |
| 窓枠 | CSS / SVG | 気温に応じたHSL補間 |
| 常時点灯 | Screen Wake Lock API | 画面消灯防止 |
| 全画面 | Fullscreen API | PWAのdisplay: fullscreen |
| 状態管理 | Zustand | 設定値と接続状態 |
| ホスティング | Vercel | HTTPS必須 |
| 品質管理 | ESLint, Prettier, Vitest, Playwright | コード品質担保 |

---

## ディレクトリ構成（想定）

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── Window/             # 窓コンポーネント
│   │   ├── WindowFrame.tsx     # 窓枠（気温で色変化）
│   │   ├── FogLayer.tsx        # 曇りレイヤー（Canvas）
│   │   ├── DrawingLayer.tsx    # 手書きレイヤー（Canvas）
│   │   └── WeatherOverlay.tsx  # 天気表示（PixiJS）
│   ├── HaaDetector/        # 「はー」検出
│   └── ui/                 # 共通UIコンポーネント
├── hooks/
│   ├── useHaaDetection.ts      # 息検出
│   ├── useFogCanvas.ts         # 曇りCanvas操作
│   ├── useDrawing.ts           # 手書き処理
│   ├── useSupabaseSync.ts      # リアルタイム同期
│   ├── useWeather.ts           # 天気取得
│   └── useWakeLock.ts          # 画面常時点灯
├── lib/
│   ├── supabase.ts             # Supabaseクライアント
│   ├── weather.ts              # Open-Meteo API
│   └── bluesky.ts              # Bluesky OAuth
├── stores/
│   └── useAppStore.ts          # Zustand store
├── types/
│   └── index.ts                # 型定義
├── config.ts                   # 設定パラメータ
└── schemas/
    └── events.ts               # Zodスキーマ
```

---

## 設定パラメータ

```typescript
// src/config.ts
export const CONFIG = {
  // 曇りが戻って文字が消えるまでの時間(ms)
  FOG_RECOVER_MS: 3 * 60 * 1000, // 本番: 3分
  // FOG_RECOVER_MS: 30 * 1000,  // デモ: 30秒

  // 「はー」検出後、自端末のマイクを無効にする時間(ms)
  HAA_MUTE_MS: 3000,

  // 窓の縦横比
  WINDOW_ASPECT: 4 / 3,
} as const;
```

---

## 設計方針

### データの扱い

- **メッセージは保存しない**: リレーのみ。曇りが戻ると文字が消える
- **筆跡データはBlueskyに保存しない**: 認証のみに使用
- **音声は保存しない**: 「はー」検出はローカル処理のみ

### Canvas構成（2枚重ね）

1. **曇りレイヤー**: `destination-out`で拭き取り表現
2. **手書きレイヤー**: `perfect-freehand`で滑らかな筆跡

### 入力処理

- Pointer Eventsで指・マウス・ペンを統一処理
- タッチとペンの両対応

### 同期イベント（Zodで検証）

```typescript
// 送信するイベントの例
const StrokeEventSchema = z.object({
  type: z.literal('stroke'),
  points: z.array(z.object({
    x: z.number(),
    y: z.number(),
    pressure: z.number().optional(),
  })),
  timestamp: z.number(),
});

const FogEventSchema = z.object({
  type: z.literal('fog'),
  timestamp: z.number(),
});
```

---

## 開発ステップ

| ステップ | 内容 | 備考 |
|----------|------|------|
| 1 | 1台で動く窓（天気表示、窓枠、曇り、手書き、再曇り） | ネットワークなし |
| 2 | 「はー」検出で曇らせる | Web Audio API |
| 3 | 2台の同期（固定チャンネルで接続） | Supabase Realtime |
| 4 | Bluesky OAuthでログイン・ペアリング | 最大の難所 |
| 5 | Wake Lock、全画面、PWA化、仕上げ | 発表準備 |

**ステップ3まででデモとして成立する**

---

## コーディング規約

### TypeScript

- `strict: true` を必ず有効化
- `any`は原則禁止、必要な場合は`unknown`を使用
- 型は`types/index.ts`に集約

### React

- 関数コンポーネント + Hooks
- Props型は`interface`で定義
- イベントハンドラは`handle`プレフィックス（例: `handlePointerDown`）

### 命名規則

- コンポーネント: PascalCase（例: `FogLayer`）
- 関数・変数: camelCase（例: `useFogCanvas`）
- 定数: UPPER_SNAKE_CASE（例: `FOG_RECOVER_MS`）
- ファイル: コンポーネントはPascalCase、その他はcamelCase

### コミットメッセージ

```
Add 機能名
Fix バグ内容
Update 変更内容
Remove 削除内容
Refactor リファクタ内容
```

---

## 環境変数

```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## コマンド

```bash
# 開発サーバー起動
npm run dev

# 型チェック
npm run type-check

# Lint
npm run lint

# テスト
npm run test

# ビルド
npm run build
```

---

## 注意事項

- HTTPSが必須（マイク・位置情報のため）→ Vercelでホスティング
- 窓の向きは固定しない（縦横どちらでも使える）
- 通知機能は今回対応しない
- 室温はダミー値（画面上のスライダーで入力）

---

## フェーズ別タスク分割

### Phase 0: 土台づくり

| ID | タスク | 完了条件 |
|----|--------|----------|
| T0-1 | Next.js (App Router, TS strict) + ESLint/Prettier/Vitest + npm scripts | type-check lint test build が通る |
| T0-2 | CLAUDE.mdのディレクトリ構成の雛形、config.ts、types/index.ts | 構成どおりにファイルがあり、CONFIGの値が定義されている |
| T0-3 | Zustandストア（設定値・接続状態） | 型付きストアがあり、テストがある |

### Phase 1: 1台で動く窓（ネットワークなし）

| ID | タスク | 完了条件 |
|----|--------|----------|
| T1-1 | WindowFrame（縦横両対応、WINDOW_ASPECT、気温→HSL補間） | 気温で色が変わり、回転しても崩れない |
| T1-2 | lib/weather.ts + useWeather（Open-Meteo: 天気コード・気温・日の出/日没） | 取得処理が単体テストできる（fetchをモック） |
| T1-3 | WeatherOverlay（PixiJSで雨・雪・雲） | 天気コードに応じた粒子が表示される |
| T1-4 | FogLayer（曇りCanvas、destination-outで拭き取り） | 指でなぞると拭ける |
| T1-5 | DrawingLayer（Pointer Events + perfect-freehand、2枚重ね） | 指・マウス・ペンで描け、タッチとペン両対応 |
| T1-6 | 再曇り（FOG_RECOVER_MS 経過で曇りが戻り文字が消える） | デモ設定30秒で動作確認できる |
| T1-7 | 室温スライダー（ダミー値の入力UI） | スライダーの値が窓枠の色に反映される |
| T1-8 | 統合（page.tsx）+ Playwrightで基本動作のE2E | 1台での一連の流れがE2Eで通る |

T1-1〜T1-3 は互いに独立しているため、並行して進められます（後述）。

### Phase 2: 「はー」で曇らせる

| ID | タスク | 完了条件 |
|----|--------|----------|
| T2-1 | useHaaDetection（AnalyserNodeで音量・スペクトル判定、閾値は定数化） | 判定ロジックが単体テストできる（音声データをモック） |
| T2-2 | HaaDetector UI（マイク権限の取得・状態表示）+ HAA_MUTE_MS のミュート | 検出後3秒マイクが無効になる |
| T2-3 | 検出 → FogLayer の曇らせを連動 | 実際に息を吹きかけると曇る |

### Phase 3: 2台の同期（ここまでがデモとして成立）

| ID | タスク | 完了条件 |
|----|--------|----------|
| T3-1 | lib/supabase.ts、環境変数、固定チャンネル接続 | .env.local で接続できる |
| T3-2 | schemas/events.ts（Zod: StrokeEvent / FogEvent）+ 検証テスト | 不正なペイロードが弾かれる |
| T3-3 | useSupabaseSync（Broadcastの送受信、受信側へ描画・曇りを反映） | 送信側の筆跡が受信側に出る |
| T3-4 | 2ブラウザでのE2E（Playwrightの2コンテキスト） | 片方で描いた文字がもう片方に出る |

### Phase 4: Bluesky認証・ペアリング（最難所）

| ID | タスク | 完了条件 |
|----|--------|----------|
| T4-0 | 調査スパイク: @atproto/oauth-client-browser のクライアントメタデータ、リダイレクトURI、ローカルとVercelの違い | 方式を決めたメモがある（コードは書かない） |
| T4-1 | lib/bluesky.ts（OAuthログイン・セッション復元） | ログイン→戻り→セッション維持が動く |
| T4-2 | ペアリング（ハンドルで相手を特定）+ Supabase RLSでペア限定チャンネル | 第三者がチャンネルを購読できない |
| T4-3 | Geolocation を使い相手側の天気を取得・表示 | 相手の地域の天気が窓に映る |

T4-0 を先に行うと、後の手戻りを減らせます。OAuthはハマりやすいため、分割せずに専用セッションで扱うことを推奨します。

### Phase 5: 仕上げ・発表準備

| ID | タスク |
|----|--------|
| T5-1 | useWakeLock（Screen Wake Lock API） |
| T5-2 | 全画面（Fullscreen API） |
| T5-3 | Serwist によるPWA化（manifest、ホーム画面追加） |
| T5-4 | Vercelデプロイ（HTTPS、環境変数の設定） |
| T5-5 | デモ用設定への切り替えと発表用の調整 |
