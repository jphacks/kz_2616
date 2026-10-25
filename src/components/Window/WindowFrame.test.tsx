import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { WindowFrame } from './WindowFrame';

describe('WindowFrame', () => {
  it('子要素をガラス部分に表示する', () => {
    const html = renderToStaticMarkup(<WindowFrame>中身</WindowFrame>);

    expect(html).toContain('中身');
  });
});
