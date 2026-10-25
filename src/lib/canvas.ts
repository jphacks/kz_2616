/** Canvas の内容を、別の Canvas に複製する */
export function copyCanvas(source: HTMLCanvasElement): HTMLCanvasElement {
  const copy = document.createElement('canvas');
  copy.width = source.width;
  copy.height = source.height;
  copy.getContext('2d')?.drawImage(source, 0, 0);
  return copy;
}

/**
 * Canvas の描画解像度を CSS サイズと devicePixelRatio に合わせ、
 * 座標系を CSS ピクセルに揃えた 2D コンテキストを返す。
 * サイズを変えると内容は消えるため、呼び出し側で描き直す。
 */
export function fitCanvasToDisplay(canvas: HTMLCanvasElement): CanvasRenderingContext2D | null {
  const context = canvas.getContext('2d');
  if (!context) {
    return null;
  }

  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(canvas.clientWidth * dpr);
  canvas.height = Math.round(canvas.clientHeight * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  return context;
}
