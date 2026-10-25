import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { DrawingLayer } from './DrawingLayer';

describe('DrawingLayer', () => {
  it('手書きの Canvas を出力する', () => {
    const html = renderToStaticMarkup(<DrawingLayer canvasRef={{ current: null }} />);
    expect(html).toContain('<canvas');
  });
});
