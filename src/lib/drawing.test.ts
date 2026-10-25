import { describe, expect, it, vi } from 'vitest';

import { drawStroke, type PathContext } from './drawing';

function createRecordingContext() {
  const calls: string[] = [];
  const context: PathContext = {
    beginPath: vi.fn(() => calls.push('beginPath')),
    moveTo: vi.fn(() => calls.push('moveTo')),
    lineTo: vi.fn(() => calls.push('lineTo')),
    closePath: vi.fn(() => calls.push('closePath')),
    fill: vi.fn(() => calls.push('fill')),
  };
  return { context, calls };
}

describe('drawStroke', () => {
  it('2点以上の画は輪郭を閉じたパスとして塗りつぶす', () => {
    const { context, calls } = createRecordingContext();

    drawStroke(context, {
      points: [
        { x: 0, y: 0 },
        { x: 50, y: 0 },
        { x: 100, y: 20 },
      ],
      simulatePressure: true,
    });

    expect(calls[0]).toBe('beginPath');
    expect(calls[1]).toBe('moveTo');
    expect(calls).toContain('lineTo');
    expect(calls.slice(-2)).toEqual(['closePath', 'fill']);
  });

  it('筆圧つきの点を受け取っても描画できる', () => {
    const { context, calls } = createRecordingContext();

    drawStroke(context, {
      points: [
        { x: 0, y: 0, pressure: 0.2 },
        { x: 30, y: 10, pressure: 0.9 },
      ],
      simulatePressure: false,
    });

    expect(calls).toContain('fill');
  });
});
