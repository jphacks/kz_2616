import type { Container, Texture } from 'pixi.js';

import type { TimeBlend } from '../palette';

/** 背景の描画に使う、あらかじめ作ったテクスチャ */
export interface SkyTextures {
  /** 中心が明るく、外へ向かって消える丸（雪・星） */
  soft: Texture;
  /** 太陽のグロー */
  glow: Texture;
  /** 月。縁がはっきりした円 */
  disc: Texture;
  /** ぼかした雲の塊 */
  cloud: Texture;
  /** 雨の筋（上が透明、下が濃い） */
  rain: Texture;
  /** 横長の霧の帯 */
  band: Texture;
}

export interface FrameContext {
  /** 前のフレームからの経過時間(ms) */
  dtMs: number;
  /** 描画を始めてからの経過時間(秒)。揺れや明滅に使う */
  timeSec: number;
  width: number;
  height: number;
  /** 動きの速さの倍率。低モーションのときは小さくなる */
  speed: number;
  blend: TimeBlend;
}

/** 1 つの表現（雲・雨など）。view を背景のコンテナに入れて使う */
export interface Effect {
  readonly view: Container;
  update(frame: FrameContext): void;
}

export type Random = () => number;
