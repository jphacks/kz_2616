import { FOG_COLOR } from './fog';

/** 曇りの模様の 1 枚分の大きさ(px)。繰り返して敷く */
const TILE_SIZE = 128;
/** 粒の明るさのばらつき（±）。大きすぎると窓がざらついて見える */
const GRAIN_AMPLITUDE = 5;
/** ぼかした濃淡の数と、その濃さ */
const BLOTCH_COUNT = 12;
const BLOTCH_ALPHA = 0.06;

let tile: HTMLCanvasElement | null = null;

/** 曇りの粒と、ゆるい濃淡を描いた模様を 1 度だけ作る */
function createTile(): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = TILE_SIZE;
  canvas.height = TILE_SIZE;
  const context = canvas.getContext('2d');
  if (!context) {
    return canvas;
  }

  const image = context.createImageData(TILE_SIZE, TILE_SIZE);
  for (let index = 0; index < image.data.length; index += 4) {
    const grain = (Math.random() - 0.5) * 2 * GRAIN_AMPLITUDE;
    image.data[index] = FOG_COLOR[0] + grain;
    image.data[index + 1] = FOG_COLOR[1] + grain;
    image.data[index + 2] = FOG_COLOR[2] + grain;
    image.data[index + 3] = 255;
  }
  context.putImageData(image, 0, 0);

  // 端をまたいで繋がるように、タイルの外側にも同じ濃淡を描く
  for (let index = 0; index < BLOTCH_COUNT; index += 1) {
    const x = Math.random() * TILE_SIZE;
    const y = Math.random() * TILE_SIZE;
    const radius = TILE_SIZE * (0.2 + Math.random() * 0.25);
    const shade = Math.random() < 0.5 ? '255, 255, 255' : '190, 200, 210';
    for (const offsetX of [-TILE_SIZE, 0, TILE_SIZE]) {
      for (const offsetY of [-TILE_SIZE, 0, TILE_SIZE]) {
        const gradient = context.createRadialGradient(
          x + offsetX,
          y + offsetY,
          0,
          x + offsetX,
          y + offsetY,
          radius,
        );
        gradient.addColorStop(0, `rgba(${shade}, ${BLOTCH_ALPHA})`);
        gradient.addColorStop(1, `rgba(${shade}, 0)`);
        context.fillStyle = gradient;
        context.fillRect(x + offsetX - radius, y + offsetY - radius, radius * 2, radius * 2);
      }
    }
  }

  return canvas;
}

/** 曇りを塗るための模様。作れなければ null（単色で塗る） */
export function createFogPattern(context: CanvasRenderingContext2D): CanvasPattern | null {
  tile ??= createTile();
  return context.createPattern(tile, 'repeat');
}
