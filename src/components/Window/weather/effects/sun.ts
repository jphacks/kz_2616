import { Container, Sprite } from 'pixi.js';

import type { RGB } from '../palette';

import type { Effect, FrameContext, SkyTextures } from './types';

/** 太陽の大きさ（画面の高さに対する割合） */
const SUN_SIZE_RATIO = 1.1;
const BREATH_PERIOD_SEC = 8;
const BREATH_AMOUNT = 0.03;
const SUN_X_RATIO = 0.78;
const SUN_Y_RATIO = 0.22;
const WHITE: RGB = [255, 255, 255];
/** 夕焼けのときの太陽の色 */
const DUSK_TINT: RGB = [255, 176, 122];

function mixRgb(from: RGB, to: RGB, amount: number): number {
  const channel = (index: 0 | 1 | 2) =>
    Math.round(from[index] + (to[index] - from[index]) * amount);
  return (channel(0) << 16) | (channel(1) << 8) | channel(2);
}

/**
 * 太陽のグロー。昼は白く、夕方はオレンジに寄せ、ゆっくり呼吸するように大きさを変える。
 * 夜は見えなくなる。
 */
export function createSun(textures: SkyTextures): Effect {
  const view = new Container();
  const glow = new Sprite(textures.glow);
  glow.anchor.set(0.5);
  view.addChild(glow);

  return {
    view,
    update({ timeSec, width, height, blend }: FrameContext) {
      view.alpha = blend.day * 0.9 + blend.dusk * 0.5;
      glow.tint = mixRgb(WHITE, DUSK_TINT, blend.dusk);

      const breath = 1 + Math.sin((timeSec * Math.PI * 2) / BREATH_PERIOD_SEC) * BREATH_AMOUNT;
      const size = height * SUN_SIZE_RATIO * breath;
      glow.scale.set(size / textures.glow.width);
      glow.position.set(width * SUN_X_RATIO, height * SUN_Y_RATIO);
    },
  };
}
