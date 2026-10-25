import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { getStatusText, HaaDetector } from './HaaDetector';

describe('HaaDetector', () => {
  it('初期状態はマイクオフのボタンを出す', () => {
    const html = renderToStaticMarkup(<HaaDetector />);

    expect(html).toContain('息を聞く（マイクをオン）');
    expect(html).toContain('マイクはオフです');
  });
});

describe('getStatusText', () => {
  const base = { isActive: true, isMuted: false, isListening: false, error: null };

  it('状態ごとに文言を変える', () => {
    expect(getStatusText({ ...base, isActive: false })).toBe('マイクはオフです');
    expect(getStatusText(base)).toBe('マイクを準備しています…');
    expect(getStatusText({ ...base, isListening: true })).toBe('聞いています');
    expect(getStatusText({ ...base, isListening: true, isMuted: true })).toBe(
      '一時停止中（まもなく再開します）',
    );
  });

  it('エラーがあれば理由を出す', () => {
    expect(getStatusText({ ...base, error: new Error('Permission denied') })).toBe(
      'マイクを使えません（Permission denied）',
    );
  });
});
