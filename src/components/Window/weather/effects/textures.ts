import { Texture } from 'pixi.js';

import type { SkyTextures } from './types';

/** canvas に描いて、テクスチャにする。ぼかしフィルターは使わず、放射グラデーションで柔らかく見せる */
function canvasTexture(
  width: number,
  height: number,
  draw: (context: CanvasRenderingContext2D) => void,
): Texture {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (context) {
    draw(context);
  }
  return Texture.from(canvas);
}

/** 中心から外へ、色の濃さが変わる円を描く */
function radial(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  stops: readonly [number, string][],
): void {
  const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
  for (const [offset, color] of stops) {
    gradient.addColorStop(offset, color);
  }
  context.fillStyle = gradient;
  context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

/**
 * 背景で使うテクスチャを作る。Pixi の初期化後に呼ぶ。
 * 同じ見た目を何度も描かないように、天気ごとの描画では使い回す。
 */
export function createSkyTextures(): SkyTextures {
  const soft = canvasTexture(64, 64, (context) => {
    radial(context, 32, 32, 32, [
      [0, 'rgba(255,255,255,1)'],
      [0.4, 'rgba(255,255,255,0.8)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
  });

  const glow = canvasTexture(512, 512, (context) => {
    radial(context, 256, 256, 256, [
      [0, 'rgba(255,250,235,0.95)'],
      [0.25, 'rgba(255,246,220,0.55)'],
      [1, 'rgba(255,240,210,0)'],
    ]);
  });

  const disc = canvasTexture(128, 128, (context) => {
    radial(context, 64, 64, 64, [
      [0, 'rgba(255,255,255,1)'],
      [0.82, 'rgba(255,255,255,1)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
  });

  // 雲は大小の白い塊を重ねて、輪郭をぼかす
  const cloud = canvasTexture(512, 256, (context) => {
    const blobs: [number, number, number][] = [
      [150, 140, 110],
      [260, 140, 110],
      [360, 140, 100],
      [220, 160, 90],
      [310, 165, 80],
    ];
    for (const [x, y, radius] of blobs) {
      radial(context, x, y, radius, [
        [0, 'rgba(255,255,255,0.95)'],
        [0.6, 'rgba(255,255,255,0.6)'],
        [1, 'rgba(255,255,255,0)'],
      ]);
    }
  });

  const rain = canvasTexture(4, 64, (context) => {
    const gradient = context.createLinearGradient(0, 0, 0, 64);
    gradient.addColorStop(0, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(255,255,255,1)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 4, 64);
  });

  const band = canvasTexture(1024, 256, (context) => {
    // 縦につぶした円で、横長の霧を作る
    context.save();
    context.translate(512, 128);
    context.scale(1, 0.25);
    radial(context, 0, 0, 512, [
      [0, 'rgba(255,255,255,0.9)'],
      [0.5, 'rgba(255,255,255,0.5)'],
      [1, 'rgba(255,255,255,0)'],
    ]);
    context.restore();
  });

  return { soft, glow, disc, cloud, rain, band };
}

/** 作ったテクスチャを解放する（アプリを破棄したあとに呼ぶ） */
export function destroySkyTextures(textures: SkyTextures): void {
  for (const texture of Object.values(textures)) {
    texture.destroy(true);
  }
}
