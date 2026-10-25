import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { FogLayer } from './FogLayer';

describe('FogLayer', () => {
  it('曇りの Canvas を出力する', () => {
    const html = renderToStaticMarkup(<FogLayer canvasRef={{ current: null }} />);
    expect(html).toContain('<canvas');
  });
});
