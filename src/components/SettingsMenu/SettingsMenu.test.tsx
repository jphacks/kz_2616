import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SettingsMenu } from './SettingsMenu';

describe('SettingsMenu', () => {
  it('初期状態は閉じていて、設定ボタンだけを出す', () => {
    const html = renderToStaticMarkup(<SettingsMenu />);

    expect(html).toContain('設定');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('気象情報');
  });
});
