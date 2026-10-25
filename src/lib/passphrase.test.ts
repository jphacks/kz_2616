import { describe, expect, it } from 'vitest';

import { CONFIG } from '@/config';

import { validatePassphrase } from './passphrase';

describe('validatePassphrase', () => {
  it('前後の空白を取り除く', () => {
    expect(validatePassphrase('  はなこ  ')).toEqual({ passphrase: 'はなこ' });
  });

  it('全角の英数字は半角にそろえる（同じ合言葉として扱う）', () => {
    expect(validatePassphrase('ＡＢＣ１２３')).toEqual({ passphrase: 'ABC123' });
  });

  it('空や空白だけならエラーを返す', () => {
    expect(validatePassphrase('')).toHaveProperty('error');
    expect(validatePassphrase('   ')).toHaveProperty('error');
  });

  it('上限を超える長さならエラーを返す', () => {
    const tooLong = 'a'.repeat(CONFIG.PASSPHRASE_MAX_LENGTH + 1);
    expect(validatePassphrase(tooLong)).toHaveProperty('error');
  });

  it('上限ちょうどの長さは通す', () => {
    const maxLength = 'a'.repeat(CONFIG.PASSPHRASE_MAX_LENGTH);
    expect(validatePassphrase(maxLength)).toEqual({ passphrase: maxLength });
  });
});
