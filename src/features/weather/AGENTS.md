# src/features/weather/ — 天気・窓枠(担当: C)

## 役割
相手側の天気を取得し、窓の背景(空・天気)と窓枠の色を表示する部品を作る。

## 作るもの
1. `useWeather(lat, lon)` … Open-Meteoから天気を取得するフック
2. `<WeatherView />` … 天気の描画と窓枠

```ts
// useWeather
const { weather, loading, error } = useWeather(lat, lon); // weather: WeatherState

// WeatherView
type WeatherViewProps = {
  weather: WeatherState; // src/shared/types.ts
  indoorTempC: number;   // 室温(ダミー値)。気温差の表示用
};
```
`WeatherState`は`src/shared/types.ts`のものを使う。

## Open-Meteo API
キーは不要。`current`で天気コード・気温・昼夜を取る。

```
https://api.open-meteo.com/v1/forecast?latitude=36.56&longitude=136.65&current=temperature_2m,weather_code,is_day&timezone=auto
```
- 位置情報(Geolocation API)が取れない場合は、固定の都市の座標を使う
- 取得に失敗しても画面が壊れないように、エラー時はデフォルトの晴れを表示する
- レスポンスは`safeParse`で形を確認してから使う
- 再取得は10〜15分に1回程度でよい

## 天気の描画
- **まずはCSSのグラデーションで空を作る**(昼=水色、夜=濃紺、曇り=グレー)
- 雨・雪は、Canvas 2Dで数十個の粒を動かす程度で十分
- 天気コード(WMO)の分類: 0=快晴、1〜3=晴れ/曇り、45〜48=霧、51〜67=雨、71〜77=雪、80〜82=にわか雨、95〜=雷雨
- 時間が余ったら、雲の流れや星空を足す。PixiJSは使わない

## 窓枠の色
気温に応じてHSLで補間し、**淡い色**にする(彩度・明度は高め)。

| 気温 | 色 |
|---|---|
| 〜0℃ | 淡い水色 |
| 10℃前後 | 淡いミント |
| 20℃前後 | 淡いクリーム |
| 30℃〜 | 淡いピーチ |

- 窓枠はCSS(`border`、`box-shadow`、グラデーション)で、四角くリアルな質感にする
- 窓全体の縦横比は`CONFIG.WINDOW_ASPECT`(4:3)

## 守ること
- ファイル先頭に`"use client";`
- 手書きの曇りは別の担当(B)が上に重ねる。このコンポーネントは**背景と窓枠だけ**にする
- 単体で動くテストページ(`/test/weather`など)を作り、天気コードを手動で切り替えて見た目を確認する
