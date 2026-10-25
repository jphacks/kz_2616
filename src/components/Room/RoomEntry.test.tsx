import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { RoomEntry } from './RoomEntry';

describe('RoomEntry', () => {
  it('合言葉の入力欄と入室ボタンを表示する', () => {
    const html = renderToStaticMarkup(<RoomEntry />);

    expect(html).toContain('for="passphrase"');
    expect(html).toContain('id="passphrase"');
    expect(html).toContain('入室');
  });
});
