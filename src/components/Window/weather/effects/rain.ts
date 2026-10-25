import { Container, Sprite } from 'pixi.js';

import type { Intensity } from '../weatherCode';

import { range } from './common';
import type { Effect, FrameContext, Random, SkyTextures } from './types';

/** 雨の傾き（約10度、左下へ流れる） */
const SLANT = Math.PI / 18;
const TAN_SLANT = Math.tan(SLANT);
const RAIN_TINT = 0xcfe3f5;
/** 画面の外からどれだけ余裕を持って戻すか(px) */
const RESPAWN_MARGIN = 40;

interface RainLayer {
  count: number;
  /** 線の長さ(px) */
  length: readonly [number, number];
  alpha: readonly [number, number];
  /** 落ちる速さ(px/s) */
  fall: readonly [number, number];
}

// 奥は短く薄く、手前は長く濃く
const HEAVY_LAYERS: RainLayer[] = [
  { count: 50, length: [10, 14], alpha: [0.2, 0.3], fall: [700, 900] },
  { count: 50, length: [16, 22], alpha: [0.3, 0.4], fall: [900, 1100] },
  { count: 50, length: [22, 30], alpha: [0.4, 0.6], fall: [1100, 1300] },
];

const LIGHT_LAYERS: RainLayer[] = HEAVY_LAYERS.map((layer) => ({
  ...layer,
  count: Math.round(layer.count / 2),
}));

interface Drop {
  sprite: Sprite;
  x: number;
  y: number;
  length: number;
  fall: number;
}

function respawn(drop: Drop, width: number, height: number, random: Random): void {
  drop.x = range(random, 0, width + height * TAN_SLANT);
  drop.y = -range(random, 0, height * 0.2) - drop.length;
}

/** 斜めの雨。強さに応じて粒の数を変える */
export function createRain(
  textures: SkyTextures,
  intensity: Intensity,
  width: number,
  height: number,
  random: Random,
): Effect {
  const view = new Container();
  const drops: Drop[] = [];

  for (const layer of intensity === 'heavy' ? HEAVY_LAYERS : LIGHT_LAYERS) {
    for (let index = 0; index < layer.count; index += 1) {
      const length = range(random, layer.length[0], layer.length[1]);
      const sprite = new Sprite(textures.rain);
      sprite.anchor.set(0.5);
      sprite.rotation = SLANT;
      sprite.tint = RAIN_TINT;
      sprite.alpha = range(random, layer.alpha[0], layer.alpha[1]);
      sprite.scale.set(1.5 / textures.rain.width, length / textures.rain.height);
      view.addChild(sprite);

      const drop: Drop = {
        sprite,
        x: 0,
        y: range(random, 0, height),
        length,
        fall: range(random, layer.fall[0], layer.fall[1]),
      };
      drop.x = range(random, 0, width);
      drops.push(drop);
    }
  }

  return {
    view,
    update({ dtMs, speed, width: screenWidth, height: screenHeight }: FrameContext) {
      const seconds = (dtMs / 1000) * speed;
      for (const drop of drops) {
        drop.y += drop.fall * seconds;
        // 落ちた方向と同じ分だけ、左へ流れる
        drop.x -= drop.fall * TAN_SLANT * seconds;

        if (drop.y - drop.length / 2 > screenHeight + RESPAWN_MARGIN || drop.x < -RESPAWN_MARGIN) {
          respawn(drop, screenWidth, screenHeight, random);
        }
        drop.sprite.position.set(drop.x, drop.y);
      }
    },
  };
}
