import { Container, Sprite, Texture } from 'pixi.js';

import { CONFIG } from '@/config';

import { range } from './common';
import type { Effect, FrameContext, Random } from './types';

interface Flash {
  /** 経過時間(ms) */
  startMs: number;
  durationMs: number;
  peak: number;
}

/** 1 回の光り方。長さと明るさを変える */
const MAIN_FLASH = { durationMs: 300, peak: 0.85 };
const SECOND_FLASH = { durationMs: 180, peak: 0.5, delayMs: 200 };
/** 2 回続けて光る確率 */
const DOUBLE_FLASH_CHANCE = 0.35;

/**
 * 雷。全面が一瞬白く光り、すぐに消える。
 * 間隔はランダムで、ときどき 2 回続けて光る。
 */
export function createLightning(width: number, height: number, random: Random): Effect {
  const view = new Container();
  const cover = new Sprite(Texture.WHITE);
  cover.width = width;
  cover.height = height;
  view.addChild(cover);
  view.alpha = 0;

  const flashes: Flash[] = [];
  let elapsedMs = 0;
  let nextStrikeMs = range(random, CONFIG.LIGHTNING_MIN_MS, CONFIG.LIGHTNING_MAX_MS);

  return {
    view,
    update({ dtMs, width: screenWidth, height: screenHeight }: FrameContext) {
      elapsedMs += dtMs;
      if (elapsedMs >= nextStrikeMs) {
        flashes.push({ startMs: elapsedMs, ...MAIN_FLASH });
        if (random() < DOUBLE_FLASH_CHANCE) {
          flashes.push({
            startMs: elapsedMs + SECOND_FLASH.delayMs,
            durationMs: SECOND_FLASH.durationMs,
            peak: SECOND_FLASH.peak,
          });
        }
        nextStrikeMs = elapsedMs + range(random, CONFIG.LIGHTNING_MIN_MS, CONFIG.LIGHTNING_MAX_MS);
      }

      // 光っている間は、明るさが最初に最大になってから、すぐに消えていく
      let alpha = 0;
      for (let index = flashes.length - 1; index >= 0; index -= 1) {
        const flash = flashes[index];
        const progress = (elapsedMs - flash.startMs) / flash.durationMs;
        if (progress >= 1) {
          flashes.splice(index, 1);
        } else if (progress >= 0) {
          alpha = Math.max(alpha, flash.peak * (1 - progress) ** 2);
        }
      }
      view.alpha = alpha;

      cover.width = screenWidth;
      cover.height = screenHeight;
    },
  };
}
