import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { FullscreenButton } from './FullscreenButton';

describe('FullscreenButton', () => {
  it('対応していない端末では何も出さない', () => {
    const html = renderToStaticMarkup(
      <FullscreenButton supported={false} active={false} onToggle={() => undefined} />,
    );
    expect(html).toBe('');
  });

  it('全画面でないときは「全画面」、全画面のときは「全画面を終える」と出す', () => {
    const off = renderToStaticMarkup(
      <FullscreenButton supported active={false} onToggle={() => undefined} />,
    );
    const on = renderToStaticMarkup(
      <FullscreenButton supported active onToggle={() => undefined} />,
    );
    expect(off).toContain('全画面');
    expect(off).not.toContain('終える');
    expect(on).toContain('全画面を終える');
  });
});
