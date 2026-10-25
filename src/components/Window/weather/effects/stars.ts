import { Container, Sprite } from 'pixi.js';

import { range } from './common';
import type { Effect, FrameContext, Random, SkyTextures } from './types';

const STAR_COUNT = 70;
/** 星は画面の上 60% に散らす */
const STAR_AREA_RATIO = 0.6;
const MOON_SIZE_RATIO = 0.13;
const MOON_X_RATIO = 0.78;
const MOON_Y_RATIO = 0.22;
const MOON_TINT = 0xf2f5ff;

interface Star {
  sprite: Sprite;
  xRatio: number;
  yRatio: number;
  baseAlpha: number;
  twinkleFrequency: number;
  twinklePhase: number;
}

/** 夜の月と、またたく星。昼は見えない */
export function createStars(textures: SkyTextures, random: Random): Effect {
  const view = new Container();

  const moon = new Sprite(textures.disc);
  moon.anchor.set(0.5);
  moon.tint = MOON_TINT;
  moon.alpha = 0.9;
  view.addChild(moon);

  const stars: Star[] = Array.from({ length: STAR_COUNT }, () => {
    const sprite = new Sprite(textures.soft);
    sprite.anchor.set(0.5);
    sprite.tint = 0xffffff;
    sprite.scale.set(range(random, 0.06, 0.14));
    view.addChild(sprite);
    return {
      sprite,
      xRatio: random(),
      yRatio: random() * STAR_AREA_RATIO,
      baseAlpha: range(random, 0.4, 0.9),
      twinkleFrequency: range(random, 0.6, 1.6),
      twinklePhase: range(random, 0, Math.PI * 2),
    };
  });

  return {
    view,
    update({ timeSec, width, height, speed, blend }: FrameContext) {
      view.alpha = blend.night;

      const moonSize = height * MOON_SIZE_RATIO;
      moon.scale.set(moonSize / textures.disc.width);
      moon.position.set(width * MOON_X_RATIO, height * MOON_Y_RATIO);

      for (const star of stars) {
        const twinkle =
          0.6 + 0.4 * Math.sin(timeSec * star.twinkleFrequency * speed + star.twinklePhase);
        star.sprite.alpha = star.baseAlpha * twinkle;
        star.sprite.position.set(star.xRatio * width, star.yRatio * height);
      }
    },
  };
}
