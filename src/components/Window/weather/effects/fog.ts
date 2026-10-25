import { Container, Sprite } from 'pixi.js';

import { driftX, range } from './common';
import type { Effect, FrameContext, Random, SkyTextures } from './types';

interface FogBand {
  /** 帯の中心の高さ（画面の高さに対する割合） */
  yRatio: number;
  alpha: number;
  /** 画面幅に対する帯の幅 */
  widthRatio: number;
  /** 画面高さに対する帯の高さ */
  heightRatio: number;
  crossSec: number;
}

// 霧は帯を重ね、どれもコントラストを低く抑える
const FOG_BANDS: FogBand[] = [
  { yRatio: 0.25, alpha: 0.28, widthRatio: 1.5, heightRatio: 0.28, crossSec: 110 },
  { yRatio: 0.55, alpha: 0.22, widthRatio: 1.3, heightRatio: 0.22, crossSec: 90 },
  { yRatio: 0.8, alpha: 0.3, widthRatio: 1.6, heightRatio: 0.3, crossSec: 130 },
];

interface BandItem {
  sprite: Sprite;
  x: number;
  band: FogBand;
}

/** 半透明の霧の帯が、横にゆっくり漂う */
export function createFog(
  textures: SkyTextures,
  width: number,
  height: number,
  random: Random,
): Effect {
  const view = new Container();
  const items: BandItem[] = FOG_BANDS.map((band) => {
    const sprite = new Sprite(textures.band);
    sprite.anchor.set(0.5);
    sprite.width = width * band.widthRatio;
    sprite.height = height * band.heightRatio;
    sprite.alpha = band.alpha;
    view.addChild(sprite);
    return { sprite, x: range(random, 0, width), band };
  });

  return {
    view,
    update({ dtMs, speed, width: screenWidth, height: screenHeight }: FrameContext) {
      for (const item of items) {
        item.x = driftX(item.x, item.sprite.width, screenWidth, item.band.crossSec, dtMs, speed);
        item.sprite.position.set(item.x, item.band.yRatio * screenHeight);
      }
    },
  };
}
