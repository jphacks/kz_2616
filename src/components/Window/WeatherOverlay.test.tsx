import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { WeatherOverlay } from './WeatherOverlay';

describe('WeatherOverlay', () => {
  it('サーバー描画では装飾用のコンテナだけを出力する（Pixi は描画しない）', () => {
    const html = renderToStaticMarkup(<WeatherOverlay weatherCode={61} />);

    expect(html).toContain('aria-hidden="true"');
    expect(html).not.toContain('<canvas');
  });
});
