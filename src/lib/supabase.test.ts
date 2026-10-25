import { describe, expect, it } from 'vitest';

import { syncChannelName } from './supabase';

describe('syncChannelName', () => {
  it('同じ合言葉からは、いつも同じチャンネル名になる', () => {
    expect(syncChannelName('はなこ')).toBe(syncChannelName('はなこ'));
  });

  it('違う合言葉からは、違うチャンネル名になる', () => {
    expect(syncChannelName('はなこ')).not.toBe(syncChannelName('たろう'));
    expect(syncChannelName('abc')).not.toBe(syncChannelName('abd'));
  });

  it('チャンネル名に合言葉をそのまま含めない', () => {
    const name = syncChannelName('ひみつの合言葉');
    expect(name.startsWith('window-')).toBe(true);
    expect(name).not.toContain('ひみつ');
  });
});
