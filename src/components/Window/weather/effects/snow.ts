import { Container, Sprite } from 'pixi.js';

import { range } from './common';
import type { Effect, FrameContext, Random, SkyTextures } from './types';

interface SnowLayer {
  count: number;
  /** 半径(px) */
  radius: readonly [number, number];
  alpha: readonly [number, number];
  /** 落ちる速さ(px/s) */
  fall: readonly [number, number];
  /** 横に揺れる幅(px) */
  sway: readonly [number, number];
}

// 手前の粒は大きく速い。大きいぶん柔らかく見える
const SNOW_LAYERS: SnowLayer[] = [
  { count: 60, radius: [1, 2.5], alpha: [0.5, 0.8], fall: [40, 70], sway: [8, 16] },
  { count: 40, radius: [3, 4.5], alpha: [0.6, 0.9], fall: [70, 100], sway: [14, 24] },
];

/** テクスチャの見かけの半径は、拡大率の約 16 倍 */
const TEXTURE_RADIUS_PX = 16;
const SWAY_FREQUENCY_MIN = 0.4;
const SWAY_FREQUENCY_MAX = 0.9;

interface Flake {
  sprite: Sprite;
  baseX: number;
  y: number;
  fall: number;
  swayAmplitude: number;
  swayFrequency: number;
  swayPhase: number;
}

function respawn(flake: Flake, width: number, random: Random): void {
  flake.baseX = range(random, 0, width);
  flake.y = -range(random, 0, 40);
}

/** 丸い雪が、横に揺れながらゆっくり落ちる */
export function createSnow(
  textures: SkyTextures,
  width: number,
  height: number,
  random: Random,
): Effect {
  const view = new Container();
  const flakes: Flake[] = [];

  for (const layer of SNOW_LAYERS) {
    for (let index = 0; index < layer.count; index += 1) {
      const sprite = new Sprite(textures.soft);
      sprite.anchor.set(0.5);
      sprite.tint = 0xffffff;
      sprite.alpha = range(random, layer.alpha[0], layer.alpha[1]);
      sprite.scale.set(range(random, layer.radius[0], layer.radius[1]) / TEXTURE_RADIUS_PX);
      view.addChild(sprite);

      flakes.push({
        sprite,
        baseX: range(random, 0, width),
        y: range(random, 0, height),
        fall: range(random, layer.fall[0], layer.fall[1]),
        swayAmplitude: range(random, layer.sway[0], layer.sway[1]),
        swayFrequency: range(random, SWAY_FREQUENCY_MIN, SWAY_FREQUENCY_MAX),
        swayPhase: range(random, 0, Math.PI * 2),
      });
    }
  }

  return {
    view,
    update({ dtMs, speed, timeSec, width: screenWidth, height: screenHeight }: FrameContext) {
      const seconds = (dtMs / 1000) * speed;
      for (const flake of flakes) {
        flake.y += flake.fall * seconds;
        if (flake.y > screenHeight + TEXTURE_RADIUS_PX) {
          respawn(flake, screenWidth, random);
        }
        const sway =
          Math.sin(timeSec * flake.swayFrequency * speed + flake.swayPhase) * flake.swayAmplitude;
        flake.sprite.position.set(flake.baseX + sway, flake.y);
      }
    },
  };
}
