'use client';

import { Application, Graphics } from 'pixi.js';
import { useEffect, useRef } from 'react';

import { classifyWeatherCode } from '@/lib/weatherKind';
import { createParticles, type Particle, stepParticles } from '@/lib/weatherParticles';

import styles from './WeatherOverlay.module.css';

interface WeatherOverlayProps {
  /** WMO weather code。晴れ以外の場合に粒子を描画する */
  weatherCode: number;
}

interface ParticleView {
  particle: Particle;
  graphic: Graphics;
}

function drawParticle(particle: Particle): Graphics {
  const graphic = new Graphics();
  switch (particle.kind) {
    case 'rain':
      graphic.rect(0, 0, 1.5, particle.size).fill({ color: 0xcfe3f5, alpha: particle.alpha });
      break;
    case 'snow':
      graphic.circle(0, 0, particle.size).fill({ color: 0xffffff, alpha: particle.alpha });
      break;
    case 'cloud':
      graphic
        .ellipse(0, 0, particle.size, particle.size * 0.45)
        .fill({ color: 0xffffff, alpha: particle.alpha });
      break;
  }
  return graphic;
}

export function WeatherOverlay({ weatherCode }: WeatherOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const weatherKind = classifyWeatherCode(weatherCode);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || weatherKind === 'clear') {
      return;
    }

    const app = new Application();
    let initialized = false;
    let disposed = false;

    const setup = async () => {
      await app.init({
        backgroundAlpha: 0,
        resizeTo: container,
        antialias: true,
        resolution: window.devicePixelRatio,
        autoDensity: true,
      });
      initialized = true;

      // 初期化の完了前にアンマウントされた場合は、ここで破棄する
      if (disposed) {
        app.destroy(true, { children: true });
        return;
      }

      container.appendChild(app.canvas);

      const views: ParticleView[] = createParticles(
        weatherKind,
        app.screen.width,
        app.screen.height,
      ).map((particle) => {
        const graphic = drawParticle(particle);
        app.stage.addChild(graphic);
        return { particle, graphic };
      });

      const particles = views.map((view) => view.particle);
      app.ticker.add((ticker) => {
        stepParticles(particles, ticker.deltaMS, app.screen.width, app.screen.height);
        for (const { particle, graphic } of views) {
          graphic.position.set(particle.x, particle.y);
        }
      });
    };

    void setup();

    return () => {
      disposed = true;
      if (initialized) {
        app.destroy(true, { children: true });
      }
    };
  }, [weatherKind]);

  return <div ref={containerRef} className={styles.overlay} aria-hidden="true" />;
}
