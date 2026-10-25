import { describe, expect, it } from 'vitest';

import { selectConfig } from './demoConfig';

const BASE = { BREATH_FOG_FADE_OUT_MS: 60_000, HAA_MUTE_MS: 3000 };
const DEMO = { BREATH_FOG_FADE_OUT_MS: 30_000 };

describe('selectConfig', () => {
  it('デモでないときは、通常の値をそのまま使う', () => {
    expect(selectConfig(BASE, DEMO, false)).toEqual(BASE);
  });

  it('デモのときは、上書きした値だけを変え、ほかは通常の値のまま', () => {
    expect(selectConfig(BASE, DEMO, true)).toEqual({
      BREATH_FOG_FADE_OUT_MS: 30_000,
      HAA_MUTE_MS: 3000,
    });
  });
});
