# src/features/fog-canvas/ — 曇り+手書き(担当: B)

## 役割
曇った窓を指で拭くと文字が書け、時間が経つと曇りが戻って文字が消える部品を作る。

## 作るもの
`<FogCanvas />` コンポーネント1つ。

```tsx
type FogCanvasProps = {
  remoteStrokes: Stroke[];                 // 相手が書いたストローク(受信分)
  fogTrigger: number;                      // 値が変わるたびに窓を曇らせる(Date.now()を渡す)
  onLocalStroke: (stroke: Stroke) => void; // 自分が書き終えたときに呼ぶ
};
```
`Stroke`は`src/shared/schema.ts`のものを使う。

## 実装の方針(この順で作る)
1. **曇りレイヤー**: Canvasを全面、白っぽい半透明で塗る
2. **拭く処理**: Pointer Events(`pointerdown/move/up`)で線を引き、`globalCompositeOperation = "destination-out"`で曇りを消す → 拭いた跡から後ろの天気が見える
3. **座標の正規化**: 送るストロークの座標は、Canvasの幅・高さで割って**0〜1**にする。受信時は逆に掛けて描画する
4. **自分の線を`onLocalStroke`で通知**(`pointerup`で1ストローク完了として呼ぶ)
5. **相手の線を描画**: `remoteStrokes`が増えたら、同じ方法で曇りを消す
6. **再曇り**: 拭いた時刻を覚え、`CONFIG.FOG_RECOVER_MS`かけて徐々に曇りが戻るようにする
7. **`fogTrigger`が変わったら**、曇りを一気に濃くする(「はー」の効果)

## 再曇りのヒント
- `requestAnimationFrame`で毎フレーム、拭いた跡の上に薄い白を少しずつ重ねる方法が簡単
- 戻る速さは`CONFIG.FOG_RECOVER_MS`だけで決まるようにする(別の数値を作らない)
- 難しければ、まず「全体が一定時間で均一に曇る」だけでよい

## 守ること
- ファイル先頭に`"use client";`
- Canvasの内部サイズ(`width/height`属性)と表示サイズ(CSS)を区別する。タブレットは`devicePixelRatio`を考慮する
- Canvasに`touch-action: none`を指定する(指でなぞるときに画面がスクロールしないように)
- 通信は触らない(`onLocalStroke`と`remoteStrokes`だけで繋ぐ)
- 線の太さは最初は固定でよい。`perfect-freehand`は時間が余ったら

## 動作確認
単体で動くテストページ(`/test/fog`など)を作り、通信なしで「書ける・消える・曇りが戻る」を確認してからPRを出す。
