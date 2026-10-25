import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { CONFIG } from '@/config';

import { TemperatureSlider } from './TemperatureSlider';

describe('TemperatureSlider', () => {
  it('現在値と範囲を反映したレンジ入力を出力する', () => {
    const html = renderToStaticMarkup(<TemperatureSlider value={20} onChange={() => undefined} />);

    expect(html).toContain('type="range"');
    expect(html).toContain(`min="${CONFIG.ROOM_TEMPERATURE_MIN_C}"`);
    expect(html).toContain(`max="${CONFIG.ROOM_TEMPERATURE_MAX_C}"`);
    expect(html).toContain('室温 20.0℃');
  });
});
