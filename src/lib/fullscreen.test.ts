import { describe, expect, it, vi } from 'vitest';

import { toggleFullscreen } from './fullscreen';

function fakeDocument(fullscreenElement: unknown = null) {
  return {
    fullscreenEnabled: true,
    fullscreenElement,
    exitFullscreen: vi.fn().mockResolvedValue(undefined),
  };
}

describe('toggleFullscreen', () => {
  it('全画面でないときは、対象を全画面にして true を返す', async () => {
    const doc = fakeDocument();
    const target = { requestFullscreen: vi.fn().mockResolvedValue(undefined) };

    await expect(toggleFullscreen(doc, target)).resolves.toBe(true);
    expect(target.requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it('全画面のときは、全画面を終えて false を返す', async () => {
    const doc = fakeDocument({});
    const target = { requestFullscreen: vi.fn().mockResolvedValue(undefined) };

    await expect(toggleFullscreen(doc, target)).resolves.toBe(false);
    expect(doc.exitFullscreen).toHaveBeenCalledTimes(1);
    expect(target.requestFullscreen).not.toHaveBeenCalled();
  });

  it('拒否されても例外を外に出さず、今の状態を返す', async () => {
    const doc = fakeDocument();
    const target = { requestFullscreen: vi.fn().mockRejectedValue(new Error('denied')) };

    await expect(toggleFullscreen(doc, target)).resolves.toBe(false);
  });
});
