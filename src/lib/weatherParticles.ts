import type { WeatherKind } from './weatherKind';

export type ParticleKind = 'rain' | 'snow' | 'cloud';

export interface Particle {
  kind: ParticleKind;
  x: number;
  y: number;
  /** 速度(px/s) */
  vx: number;
  vy: number;
  /** 大きさ(px)。雨は線の長さ、雪は半径、雲は横方向の半径 */
  size: number;
  alpha: number;
}

type Random = () => number;

const PARTICLE_COUNT: Record<ParticleKind, number> = {
  rain: 120,
  snow: 60,
  cloud: 6,
};

/** 画面外に出た粒子が反対側から戻るまでの余白(px) */
const WRAP_MARGIN = 40;

/** 天気の大分類ごとに出す粒子の種類 */
export function particleKindsFor(weather: WeatherKind): ParticleKind[] {
  switch (weather) {
    case 'clear':
      return [];
    case 'cloudy':
      return ['cloud'];
    case 'rain':
      return ['cloud', 'rain'];
    case 'snow':
      return ['cloud', 'snow'];
  }
}

function range(random: Random, min: number, max: number): number {
  return min + (max - min) * random();
}

function createParticle(
  kind: ParticleKind,
  width: number,
  height: number,
  random: Random,
): Particle {
  switch (kind) {
    case 'rain':
      return {
        kind,
        x: range(random, 0, width),
        y: range(random, 0, height),
        vx: range(random, -200, -120),
        vy: range(random, 900, 1300),
        size: range(random, 10, 18),
        alpha: range(random, 0.4, 0.7),
      };
    case 'snow':
      return {
        kind,
        x: range(random, 0, width),
        y: range(random, 0, height),
        vx: range(random, -20, 20),
        vy: range(random, 40, 90),
        size: range(random, 2, 5),
        alpha: range(random, 0.7, 1),
      };
    case 'cloud':
      return {
        kind,
        x: range(random, 0, width),
        y: range(random, 0, height / 3),
        vx: range(random, 8, 20),
        vy: 0,
        size: range(random, 120, 220),
        alpha: range(random, 0.25, 0.4),
      };
  }
}

/** 天気の大分類に応じた粒子を生成する */
export function createParticles(
  weather: WeatherKind,
  width: number,
  height: number,
  random: Random = Math.random,
): Particle[] {
  return particleKindsFor(weather).flatMap((kind) =>
    Array.from({ length: PARTICLE_COUNT[kind] }, () => createParticle(kind, width, height, random)),
  );
}

/** 粒子を dtMs ミリ秒進める。画面外に出た粒子は反対側から戻す(in-place) */
export function stepParticles(
  particles: Particle[],
  dtMs: number,
  width: number,
  height: number,
): void {
  const dtSec = dtMs / 1000;
  for (const particle of particles) {
    particle.x += particle.vx * dtSec;
    particle.y += particle.vy * dtSec;

    if (particle.y > height + WRAP_MARGIN) {
      particle.y = -WRAP_MARGIN;
    }
    if (particle.x > width + WRAP_MARGIN) {
      particle.x = -WRAP_MARGIN;
    } else if (particle.x < -WRAP_MARGIN) {
      particle.x = width + WRAP_MARGIN;
    }
  }
}
