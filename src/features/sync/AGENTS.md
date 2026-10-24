# src/features/sync/ — 2台の同期(担当: リーダー)

## 役割
Supabase Realtime(Broadcast)で、2台の間で`WindowEvent`を送受信する。

## 作るもの
`useWindowChannel(roomCode: string)` というフック1つ。

```ts
const { send, sourceId, connected } = useWindowChannel(roomCode, {
  onEvent: (event: WindowEvent) => { /* 受信したイベント */ },
});
send({ type: "stroke", stroke, sourceId });
```

## 実装の要点
- チャンネル名は`room:${roomCode}`。合言葉(部屋コード)を入力した2台が同じチャンネルに入る
- 送信オプションで`self: false`にして、自分が送ったイベントは自分に返さない
- `sourceId`は起動時に`crypto.randomUUID()`で作る
- 受信したデータは**必ず`WindowEvent.safeParse()`で検証**し、失敗したら捨てる(ログだけ出す)
- ストロークはデータ量を抑えるため、点を間引くか、ストローク完了時にまとめて送る
- DBテーブルへは何も書かない(メッセージは保存しない)
- Supabaseのキーは`NEXT_PUBLIC_SUPABASE_URL`と`NEXT_PUBLIC_SUPABASE_ANON_KEY`のみ

## 他の担当との境界
- B(fog-canvas): `onLocalStroke`で受け取ったストロークを`send`する。受信した`stroke`を`remoteStrokes`として渡す
- D(audio): 「はー」検出で`fog`イベントを`send`する。受信した`fog`は両端末の曇りに反映する
- 「はー」の発信元以外の端末は、`HAA_MUTE_MS`の間マイク検出を止める(音の回り込み防止)

## 未完成でも他の人が進められるように
最初に、**自分に送ったイベントを自分に返すだけのモック版**を`mock.ts`として用意し、早めにpushする。
