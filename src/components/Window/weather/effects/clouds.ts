import { Container, Sprite } from 'pixi.js';

import type { WeatherCategory } from '../weatherCode';

import { driftX, range } from './common';
import type { Effect, FrameContext, Random, SkyTextures } from './types';

/** 雲の層。手前の層ほど速く流れる（crossSec が短い） */
export interface CloudLayer {
  count: number;
  alpha: number;
  /** 画面を横切るのにかかる秒数 */
  crossSec: number;
  /** 出す高さの範囲（画面の高さに対する割合） */
  topRatio: number;
  bottomRatio: number;
  /** 雲の高さに対する横幅の範囲 */
  widthMin: number;
  widthMax: number;
  tint?: number;
}

const RAIN_CLOUD_TINT = 0x8d98a6;
/** 雲の濃さの倍率。各層の alpha にかけて、1 を超えないようにする */
const CLOUD_DENSITY = 2;

/** 天気ごとの雲の層。霧は帯（fog.ts）で表すので雲は出さない */
export function cloudLayersFor(category: WeatherCategory): CloudLayer[] {
  switch (category) {
    case 'clear':
      return [
        {
          count: 2,
          alpha: 0.18,
          crossSec: 110,
          topRatio: 0.1,
          bottomRatio: 0.35,
          widthMin: 1.2,
          widthMax: 1.8,
        },
      ];
    case 'partlyCloudy':
      return [
        {
          count: 3,
          alpha: 0.3,
          crossSec: 70,
          topRatio: 0.05,
          bottomRatio: 0.4,
          widthMin: 1,
          widthMax: 1.6,
        },
      ];
    case 'cloudy':
      return [
        {
          count: 3,
          alpha: 0.28,
          crossSec: 90,
          topRatio: 0.02,
          bottomRatio: 0.3,
          widthMin: 1.4,
          widthMax: 2,
        },
        {
          count: 3,
          alpha: 0.35,
          crossSec: 60,
          topRatio: 0.2,
          bottomRatio: 0.5,
          widthMin: 1.2,
          widthMax: 1.8,
        },
        {
          count: 2,
          alpha: 0.42,
          crossSec: 40,
          topRatio: 0.4,
          bottomRatio: 0.7,
          widthMin: 1,
          widthMax: 1.6,
        },
      ];
    case 'fog':
      return [];
    case 'rain':
      return [
        {
          count: 3,
          alpha: 0.3,
          crossSec: 70,
          topRatio: 0.02,
          bottomRatio: 0.3,
          widthMin: 1.4,
          widthMax: 2,
          tint: RAIN_CLOUD_TINT,
        },
        {
          count: 3,
          alpha: 0.4,
          crossSec: 45,
          topRatio: 0.2,
          bottomRatio: 0.55,
          widthMin: 1.2,
          widthMax: 1.8,
          tint: RAIN_CLOUD_TINT,
        },
      ];
    case 'thunderstorm':
      return [
        {
          count: 4,
          alpha: 0.4,
          crossSec: 60,
          topRatio: 0.02,
          bottomRatio: 0.35,
          widthMin: 1.4,
          widthMax: 2,
          tint: RAIN_CLOUD_TINT,
        },
        {
          count: 3,
          alpha: 0.45,
          crossSec: 40,
          topRatio: 0.25,
          bottomRatio: 0.55,
          widthMin: 1.2,
          widthMax: 1.8,
          tint: RAIN_CLOUD_TINT,
        },
      ];
    case 'snow':
      return [
        {
          count: 2,
          alpha: 0.3,
          crossSec: 80,
          topRatio: 0.05,
          bottomRatio: 0.35,
          widthMin: 1.2,
          widthMax: 1.8,
        },
      ];
  }
}

interface CloudItem {
  sprite: Sprite;
  x: number;
  yRatio: number;
  crossSec: number;
}

/** ぼかした雲の塊を、層ごとに横へ流す */
export function createClouds(
  textures: SkyTextures,
  layers: CloudLayer[],
  width: number,
  height: number,
  random: Random,
): Effect {
  const view = new Container();
  const items: CloudItem[] = [];

  for (const layer of layers) {
    for (let index = 0; index < layer.count; index += 1) {
      const sprite = new Sprite(textures.cloud);
      sprite.anchor.set(0.5);
      // 雲の幅は画面の高さから決める（縦横どちらの向きでも同じ大きさに見える）
      const cloudWidth = height * range(random, layer.widthMin, layer.widthMax) * 0.5;
      sprite.scale.set(cloudWidth / textures.cloud.width);
      sprite.alpha = Math.min(layer.alpha * CLOUD_DENSITY, 1);
      if (layer.tint !== undefined) {
        sprite.tint = layer.tint;
      }
      view.addChild(sprite);
      items.push({
        sprite,
        x: range(random, 0, width),
        yRatio: range(random, layer.topRatio, layer.bottomRatio),
        crossSec: layer.crossSec,
      });
    }
  }

  return {
    view,
    update({ dtMs, speed, width: screenWidth, height: screenHeight }: FrameContext) {
      for (const item of items) {
        item.x = driftX(item.x, item.sprite.width, screenWidth, item.crossSec, dtMs, speed);
        item.sprite.position.set(item.x, item.yRatio * screenHeight);
      }
    },
  };
}
