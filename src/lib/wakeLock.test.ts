import { describe, expect, it, vi } from 'vitest';

import { requestScreenWakeLock } from './wakeLock';

describe('requestScreenWakeLock', () => {
  it('対応していない端末では null を返す', async () => {
    await expect(requestScreenWakeLock(undefined)).resolves.toBeNull();
  });

  it('画面の常時点灯を頼み、取れたら番兵（sentinel）を返す', async () => {
    const sentinel = { release: vi.fn().mockResolvedValue(undefined) };
    const request = vi.fn().mockResolvedValue(sentinel);

    await expect(requestScreenWakeLock({ request })).resolves.toBe(sentinel);
    expect(request).toHaveBeenCalledWith('screen');
  });

  it('拒否されても例外を外に出さず、null を返す', async () => {
    const request = vi.fn().mockRejectedValue(new Error('NotAllowedError'));

    await expect(requestScreenWakeLock({ request })).resolves.toBeNull();
  });
});
