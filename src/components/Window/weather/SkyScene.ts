import { Container } from 'pixi.js';

import { CONFIG } from '@/config';

import { cloudLayersFor, createClouds } from './effects/clouds';
import { createFog } from './effects/fog';
import { createLightning } from './effects/lightning';
import { createRain } from './effects/rain';
import { createSnow } from './effects/snow';
import { createStars } from './effects/stars';
import { createSun } from './effects/sun';
import type { Effect, FrameContext, Random, SkyTextures } from './effects/types';
import type { TimeBlend } from './palette';
import type { WeatherLook } from './weatherCode';

/** 低モーションのときの動きの速さ（通常は 1） */
const REDUCED_MOTION_SPEED = 0.25;
/** 1 フレームで進める時間の上限(ms)。タブを戻したときに一気に跳ばないようにする */
const MAX_DT_MS = 100;

interface SkyOptions {
  reducedMotion: boolean;
  random?: Random;
}

interface Group {
  key: string;
  view: Container;
  effects: Effect[];
  /** 0〜1。1 に向かうか 0 に向かうかは target で決める */
  alpha: number;
  target: 0 | 1;
}

/** 天気の表現（使う効果）を組み立てる。低モーションでは雷を出さない */
function buildEffects(
  look: WeatherLook,
  textures: SkyTextures,
  width: number,
  height: number,
  options: SkyOptions,
  random: Random,
): Effect[] {
  const effects: Effect[] = [];
  const { category, intensity } = look;

  if (category === 'clear' || category === 'partlyCloudy') {
    effects.push(createSun(textures), createStars(textures, random));
  }
  const cloudLayers = cloudLayersFor(category);
  if (cloudLayers.length > 0) {
    effects.push(createClouds(textures, cloudLayers, width, height, random));
  }
  if (category === 'fog') {
    effects.push(createFog(textures, width, height, random));
  }
  if (category === 'rain') {
    effects.push(createRain(textures, intensity, width, height, random));
  }
  if (category === 'thunderstorm') {
    effects.push(createRain(textures, 'heavy', width, height, random));
    if (!options.reducedMotion) {
      effects.push(createLightning(width, height, random));
    }
  }
  if (category === 'snow') {
    effects.push(createSnow(textures, width, height, random));
  }
  return effects;
}

/**
 * 窓の中の天気の表現をまとめて動かす。
 * 天気が変わるときは、古い表現をフェードアウトしながら新しい表現をフェードインする。
 */
export class SkyScene {
  readonly root = new Container();

  private readonly textures: SkyTextures;
  private readonly options: SkyOptions;
  private readonly random: Random;
  private groups: Group[] = [];
  private blend: TimeBlend = { day: 1, dusk: 0, night: 0 };
  private elapsedSec = 0;
  private width: number;
  private height: number;

  constructor(textures: SkyTextures, width: number, height: number, options: SkyOptions) {
    this.textures = textures;
    this.options = options;
    this.random = options.random ?? Math.random;
    this.width = width;
    this.height = height;
  }

  /** 天気が変わったら、新しい表現にクロスフェードで切り替える */
  setLook(look: WeatherLook): void {
    const key = `${look.category}:${look.intensity}`;
    if (this.groups.some((group) => group.key === key && group.target === 1)) {
      return;
    }

    for (const group of this.groups) {
      group.target = 0;
    }

    const view = new Container();
    view.alpha = 0;
    const effects = buildEffects(
      look,
      this.textures,
      this.width,
      this.height,
      this.options,
      this.random,
    );
    for (const effect of effects) {
      view.addChild(effect.view);
    }
    this.root.addChild(view);
    this.groups.push({ key, view, effects, alpha: 0, target: 1 });
  }

  /** 日の出・日没からの空の配色の重み。次のフレームから反映する */
  setBlend(blend: TimeBlend): void {
    this.blend = blend;
  }

  update(dtMs: number, width: number, height: number): void {
    const clampedDtMs = Math.min(dtMs, MAX_DT_MS);
    this.width = width;
    this.height = height;
    this.elapsedSec += clampedDtMs / 1000;

    const frame: FrameContext = {
      dtMs: clampedDtMs,
      timeSec: this.elapsedSec,
      width,
      height,
      speed: this.options.reducedMotion ? REDUCED_MOTION_SPEED : 1,
      blend: this.blend,
    };

    const step = clampedDtMs / CONFIG.WEATHER_CROSSFADE_MS;
    this.groups = this.groups.filter((group) => {
      group.alpha =
        group.target === 1 ? Math.min(group.alpha + step, 1) : Math.max(group.alpha - step, 0);
      group.view.alpha = group.alpha;

      if (group.target === 0 && group.alpha === 0) {
        group.view.destroy({ children: true });
        return false;
      }
      if (group.alpha > 0) {
        for (const effect of group.effects) {
          effect.update(frame);
        }
      }
      return true;
    });
  }

  destroy(): void {
    this.root.destroy({ children: true });
    this.groups = [];
  }
}
