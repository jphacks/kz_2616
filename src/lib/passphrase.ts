import { CONFIG } from '@/config';

export type PassphraseResult = { passphrase: string } | { error: string };

/**
 * 入力された合言葉を整える。
 * 前後の空白を取り、全角・半角の違いをそろえる（相手が別の入力方法でも同じ合言葉になるように）。
 * 空や長すぎるものは、入室できない理由を返す。
 */
export function validatePassphrase(input: string): PassphraseResult {
  const passphrase = input.normalize('NFKC').trim();
  if (passphrase.length === 0) {
    return { error: '合言葉を入力してください' };
  }
  if (passphrase.length > CONFIG.PASSPHRASE_MAX_LENGTH) {
    return { error: `合言葉は ${CONFIG.PASSPHRASE_MAX_LENGTH} 文字以内にしてください` };
  }
  return { passphrase };
}
