import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { SYNC_STATUS_LABEL, SyncStatus } from './SyncStatus';

describe('SyncStatus', () => {
  it.each([
    ['disconnected', '同期していません'],
    ['connecting', '接続しています…'],
    ['connected', '同期中（相手と共有）'],
    ['error', '同期に失敗しました'],
  ] as const)('%s のときは「%s」を出す', (status, label) => {
    const html = renderToStaticMarkup(<SyncStatus status={status} />);

    expect(SYNC_STATUS_LABEL[status]).toBe(label);
    expect(html).toContain(label);
    expect(html).toContain(`data-status="${status}"`);
    expect(html).toContain('role="status"');
  });
});
