# スマートウィンドウ(JPHACKS2026)— 全員共通ルール

## プロジェクト概要
遠距離の大切な人と、窓越しに手書きでつながるWebアプリ。
- 相手側の天気を「窓」として表示する(窓枠は気温で淡く色が変わる)
- 「はー」と声を出すと窓が曇り、指でなぞって文字を書ける(両方の画面に出る)
- 数分で曇りが戻り、文字は消える。**メッセージはどこにも保存しない**(リレーのみ)
- デモ構成: タブレット1台 + PC接続の大型モニター。別ネットワークでも動く設計(クラウド経由同期)

## 開発期間と方針
**残り約10時間。動くデモが最優先。** 凝った実装より、動くことを選ぶ。
- 作る: 天気表示、窓枠の色、曇り+手書き、「はー」検出、2台同期(Supabase Broadcast)
- 作らない: Bluesky OAuth、PWA、Supabase認証/RLS、PixiJS、通知、履歴保存
- 4時間時点で動かない部品は、機能を削ってよい(例: 「はー」→ボタンで曇らせる)

## 技術スタック
- TypeScript(strict) / Next.js(App Router)+ React ※雛形作成時に確定。Viteの場合はここを書き換える
- 同期: Supabase Realtime(Broadcastのみ。DBテーブルは使わない)
- 天気: Open-Meteo API(キー不要)
- 曇り・手書き: Canvas 2D
- 「はー」: Web Audio API(AnalyserNode)
- 入力検証: Zod

## ディレクトリと担当
| パス | 担当 | 内容 |
|---|---|---|
| `src/shared/` | リーダー | 全員の「契約」(型・スキーマ・設定)。**勝手に変更しない** |
| `src/features/sync/` | リーダー | Supabase同期 |
| `src/app/` | リーダー | 部品を組み立てる画面 |
| `src/features/fog-canvas/` | B | 曇り+手書きCanvas |
| `src/features/weather/` | C | 天気取得・天気表示・窓枠の色 |
| `src/features/audio/` | D | 「はー」検出 |

**自分の担当フォルダ以外のファイルは編集しない。** 他の人の部品に直してほしい点があれば、本人に伝える。

## Gitのルール(これだけ守る)
1. `main`に直接pushしない。1人1ブランチ(`feature/weather` `feature/fog` `feature/audio`)
2. 動いたらこまめにコミットしてpush。PRを出したら、マージはリーダーが行う
3. 迷ったらPRを出すところで止めてよい。`git`が不安ならGitHub Desktopを使う

## コーディング規約(AIにも守らせること)
- `any`を使わない。型は`src/shared/`のものを使う
- 外部から来るデータ(通信・API)は、Zodの`parse()`/`safeParse()`で検証してから使う
- 秘密のキー(Supabaseのservice role keyなど)をコードやGitに入れない。使うのは`NEXT_PUBLIC_SUPABASE_ANON_KEY`のみ。値は`.env.local`に置き、`.gitignore`に入れる
- Canvasや音声などブラウザAPIを使うコンポーネントは、ファイル先頭に`"use client";`を書く
- マジックナンバーを書かず、時間や比率は`CONFIG`(`src/shared/config.ts`)を使う
- コメントは日本語で、「なぜそうするか」を短く書く
- 新しいライブラリを追加する前に、リーダーに相談する

## AIに頼むときのコツ
- **自分の部品1つだけ**を頼む。「アプリ全体を作って」と頼まない
- 頼む前に、`src/shared/`の中身と、自分のフォルダの`AGENTS.md`をAIに読ませる
- 生成されたコードは、動かして確認してからコミットする

## コマンド
```bash
npm install     # 初回のみ
npm run dev     # 開発サーバー(http://localhost:3000)
npm run lint    # コードチェック
npm run build   # ビルド確認(PRの前に通す)
```

## 共通の契約(要約。正本は`src/shared/`)
- 座標は**0〜1に正規化**する(画面サイズが違う端末でも同じ位置に出るため)
- 窓の縦横比は**4:3固定**。余白は壁のような背景で埋める
- 通信イベントは`WindowEvent`(`stroke` / `fog` / `presence`)。全て`sourceId`(発信した端末のID)を持つ
- 曇りが戻る時間は`CONFIG.FOG_RECOVER_MS`だけで決まる(本番3分/デモ30秒)

## 想定されるファイル構成
```
kz_2616/
├─ AGENTS.md                      🆕 全員共通ルール
├─ CLAUDE.md                      🆕 中身は「@AGENTS.md」の1行
├─ .env.local                     🆕 Supabaseのキー(Gitに入れない)
├─ .env.example                   🆕 キー名だけ書いた見本(Gitに入れる)
├─ .gitignore                       (.env*が除外済みか確認)
├─ package.json
├─ tsconfig.json
├─ next.config.ts
├─ public/
└─ src/
   ├─ app/                          Next.jsのルーティング = 画面の組み立て(リーダー)
   │  ├─ AGENTS.md / CLAUDE.md   🆕
   │  ├─ layout.tsx
   │  ├─ globals.css
   │  ├─ page.tsx                   入室画面(部屋コード入力)
   │  ├─ window/
   │  │  └─ page.tsx             🆕 窓画面(部品を組み立てる)
   │  └─ test/                   🆕 各自の単体確認ページ
   │     ├─ fog/page.tsx            B
   │     ├─ weather/page.tsx        C
   │     └─ audio/page.tsx          D
   ├─ shared/                    🆕 契約(リーダー)
   │  ├─ AGENTS.md / CLAUDE.md
   │  ├─ schema.ts
   │  ├─ config.ts
   │  └─ types.ts
   └─ features/                  🆕
      ├─ sync/                      リーダー
      │  ├─ AGENTS.md / CLAUDE.md
      │  ├─ useWindowChannel.ts
      │  └─ mock.ts
      ├─ fog-canvas/                B
      │  ├─ AGENTS.md / CLAUDE.md
      │  └─ FogCanvas.tsx
      ├─ weather/                   C
      │  ├─ AGENTS.md / CLAUDE.md
      │  ├─ useWeather.ts
      │  └─ WeatherView.tsx
      └─ audio/                     D
         ├─ AGENTS.md / CLAUDE.md
         └─ useHaaDetector.ts
```
