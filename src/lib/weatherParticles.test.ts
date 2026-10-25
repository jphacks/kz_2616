import { describe, expect, it } from 'vitest';

import { createParticles, particleKindsFor, stepParticles } from './weatherParticles';

const constantRandom = () => 0.5;

describe('particleKindsFor', () => {
  it('天気ごとに出す粒子の種類を決める', () => {
    expect(particleKindsFor('clear')).toEqual([]);
    expect(particleKindsFor('cloudy')).toEqual(['cloud']);
    expect(particleKindsFor('rain')).toEqual(['cloud', 'rain']);
    expect(particleKindsFor('snow')).toEqual(['cloud', 'snow']);
  });
});

describe('createParticles', () => {
  it('晴れでは粒子を作らない', () => {
    expect(createParticles('clear', 300, 400, constantRandom)).toEqual([]);
  });

  it('雨の日は雨粒と雲を作る', () => {
    const particles = createParticles('rain', 300, 400, constantRandom);
    const rain = particles.filter((p) => p.kind === 'rain');
    const cloud = particles.filter((p) => p.kind === 'cloud');

    expect(rain).toHaveLength(120);
    expect(cloud).toHaveLength(6);
    // 雨粒は下向きに落ちる
    expect(rain.every((p) => p.vy > 0)).toBe(true);
  });

  it('雲は窓の上部にだけ生成される', () => {
    const clouds = createParticles('cloudy', 300, 400, constantRandom);
    expect(clouds.every((p) => p.y <= 400 / 3)).toBe(true);
  });
});

describe('stepParticles', () => {
  it('速度に応じて粒子を移動させる（1秒で vx・vy 分だけ進む）', () => {
    const particles = [
      { kind: 'snow' as const, x: 100, y: 100, vx: 10, vy: 20, size: 3, alpha: 1 },
    ];
    stepParticles(particles, 1000, 300, 400);

    expect(particles[0]?.x).toBeCloseTo(110);
    expect(particles[0]?.y).toBeCloseTo(120);
  });

  it('下端を越えた粒子は上端から戻す', () => {
    const particles = [
      { kind: 'rain' as const, x: 100, y: 399, vx: 0, vy: 100, size: 10, alpha: 1 },
    ];
    // 1秒後の y=499 は下端の余白(400+40)を越えている
    stepParticles(particles, 1000, 300, 400);

    expect(particles[0]?.y).toBeLessThan(0);
  });

  it('左右の端を越えた粒子は反対側へ戻す', () => {
    const particles = [
      { kind: 'cloud' as const, x: 299, y: 10, vx: 100, vy: 0, size: 100, alpha: 1 },
      { kind: 'rain' as const, x: 1, y: 10, vx: -100, vy: 0, size: 10, alpha: 1 },
    ];
    stepParticles(particles, 1000, 300, 400);

    expect(particles[0]?.x).toBeLessThan(0);
    expect(particles[1]?.x).toBeGreaterThan(300);
  });
});
