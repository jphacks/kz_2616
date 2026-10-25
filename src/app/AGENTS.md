# src/app/ — 画面

## 役割

ルーティングと画面の組み立て。実際の窓の表示は `src/components/Window/WindowScene.tsx` にある。

## 画面

- `page.tsx`: 入口。`components/Room/RoomGate` が、合言葉を入力するまで入室画面、入力後は窓を表示する
- `test/weather/page.tsx`: 天気の背景を確認するための開発用の画面（本番で使わない）

## 注意

- 窓は画面いっぱいに広げる（4:3 の枠は使わない）
- 画面に置く部品の中身は、各コンポーネントの `Props` だけで接続する
