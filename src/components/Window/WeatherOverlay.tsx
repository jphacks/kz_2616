'use client';

import { Application } from 'pixi.js';
import { useEffect, useRef, useState } from 'react';

import { CONFIG } from '@/config';

import { createSkyTextures, destroySkyTextures } from './weather/effects/textures';
import { skyStops, timeBlend, toCssGradient } from './weather/palette';
import { SkyScene } from './weather/SkyScene';
import { classifyWeather, type WeatherLook } from './weather/weatherCode';

import styles from './WeatherOverlay.module.css';

/** 現在時刻を読み直す間隔(ms) */
const CLOCK_INTERVAL_MS = 60 * 1000;

interface WeatherOverlayProps {
  /** WMO weather code */
  weatherCode: number;
  /** 日の出・日没（ISO 8601）。取れないときは 6:00 と 18:00 とみなす */
  sunrise?: string;
  sunset?: string;
  /** 時刻を外から指定する（デバッグ用）。省略すると現在時刻を使う */
  now?: Date;
}

interface SkyLayer {
  id: number;
  css: string;
}

/** 現在時刻を 1 分ごとに読み直す */
function useCurrentTime(): Date {
  const [time, setTime] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setTime(new Date()), CLOCK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);
  return time;
}

/**
 * 背景の色が変わったら、古い色の上に新しい色を重ねてフェードさせる。
 * 2 層までしか持たず、フェードが終わったら古い層を外す。
 */
function useSkyLayers(css: string): SkyLayer[] {
  const [state, setState] = useState<{ layers: SkyLayer[] }>(() => ({
    layers: [{ id: 0, css }],
  }));
  let { layers } = state;

  // 色が変わったら、描画中に層を足す（効果の中で setState すると余計な描画が増えるため）
  const top = layers[layers.length - 1];
  if (top.css !== css) {
    layers = [top, { id: top.id + 1, css }];
    setState({ layers });
  }

  useEffect(() => {
    if (layers.length < 2) {
      return;
    }
    const id = window.setTimeout(
      () => setState((previous) => ({ layers: previous.layers.slice(-1) })),
      CONFIG.WEATHER_CROSSFADE_MS,
    );
    return () => window.clearTimeout(id);
  }, [layers]);

  return layers;
}

/**
 * 天気の背景。空の色（CSS）の上に、雲・雨・雪などを PixiJS で描く。
 * 背景は透明にしない（曇りを重ねても、拭いた跡から空が見えるように）。
 */
export function WeatherOverlay({ weatherCode, sunrise, sunset, now }: WeatherOverlayProps) {
  const clock = useCurrentTime();
  const current = now ?? clock;
  const look: WeatherLook = classifyWeather(weatherCode);
  const { category, intensity } = look;
  const blend = timeBlend(current, sunrise, sunset);
  const layers = useSkyLayers(toCssGradient(skyStops(category, blend)));

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SkyScene | null>(null);
  // Pixi の初期化は非同期なので、完了したときに最新の値を使えるように保持する
  const latestRef = useRef({ look, blend });

  useEffect(() => {
    latestRef.current = { look, blend };
  });

  useEffect(() => {
    sceneRef.current?.setLook({ category, intensity });
  }, [category, intensity]);

  const { day, dusk, night } = blend;
  useEffect(() => {
    sceneRef.current?.setBlend({ day, dusk, night });
  }, [day, dusk, night]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const app = new Application();
    let initialized = false;
    let disposed = false;
    let textures: ReturnType<typeof createSkyTextures> | null = null;
    let scene: SkyScene | null = null;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // タブが隠れている間は描画を止める（電力と発熱を抑える）
    const handleVisibilityChange = () => {
      if (!initialized) {
        return;
      }
      if (document.hidden) {
        app.ticker.stop();
      } else {
        app.ticker.start();
      }
    };

    const setup = async () => {
      await app.init({
        backgroundAlpha: 0,
        resizeTo: container,
        antialias: true,
        // 端末によっては画素数が非常に多いため、2 倍までに抑える
        resolution: Math.min(window.devicePixelRatio, 2),
        autoDensity: true,
      });
      initialized = true;

      // 初期化の完了前にアンマウントされた場合は、ここで破棄する
      if (disposed) {
        app.destroy(true, { children: true });
        return;
      }

      container.appendChild(app.canvas);
      textures = createSkyTextures();
      scene = new SkyScene(textures, app.screen.width, app.screen.height, { reducedMotion });
      app.stage.addChild(scene.root);
      sceneRef.current = scene;
      scene.setLook(latestRef.current.look);
      scene.setBlend(latestRef.current.blend);

      const activeScene = scene;
      app.ticker.add((ticker) => {
        activeScene.update(ticker.deltaMS, app.screen.width, app.screen.height);
      });
      if (document.hidden) {
        app.ticker.stop();
      }
      document.addEventListener('visibilitychange', handleVisibilityChange);
    };

    void setup();

    return () => {
      disposed = true;
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      sceneRef.current = null;
      if (initialized) {
        scene?.destroy();
        app.destroy(true, { children: true });
        if (textures) {
          destroySkyTextures(textures);
        }
      }
    };
  }, []);

  return (
    <div className={styles.overlay} aria-hidden="true">
      {layers.map((layer) => (
        <div
          key={layer.id}
          className={styles.sky}
          style={{
            background: layer.css,
            animationDuration: `${CONFIG.WEATHER_CROSSFADE_MS}ms`,
          }}
        />
      ))}
      <div ref={containerRef} className={styles.canvasHost} />
    </div>
  );
}
