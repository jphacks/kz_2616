import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const CHANNEL_PREFIX = 'connectwindow-';

/**
 * 合言葉を 53 ビットの数値にまとめる（cyrb53）。
 * 暗号ではなく、合言葉をそのままチャンネル名に出さないために使う。
 * 同じ文字列からは、どの端末でも同じ値になる。
 */
function hashPassphrase(passphrase: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < passphrase.length; index += 1) {
    const code = passphrase.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hash = 4294967296 * (2097151 & h2) + (h1 >>> 0);
  return hash.toString(36);
}

/**
 * 合言葉から、同期チャンネル名を決める。
 * 同じ合言葉の 2 台は同じチャンネルに入り、違う合言葉は別のチャンネルになる。
 * 合言葉は validatePassphrase で整えてから渡すこと（全角・半角の違いで別の名前にならないように）。
 */
export function syncChannelName(passphrase: string): string {
  return `${CHANNEL_PREFIX}${hashPassphrase(passphrase)}`;
}

let client: SupabaseClient | null = null;

/**
 * Supabase のクライアントを返す。
 * 環境変数が設定されていなければ null を返し、同期は行わない（1 台で動く）。
 */
export function getSupabaseClient(): SupabaseClient | null {
  // NEXT_PUBLIC_ の変数は、ビルド時に値が埋め込まれるように直接書く
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !anonKey) {
    return null;
  }

  client ??= createClient(url, anonKey);
  return client;
}
