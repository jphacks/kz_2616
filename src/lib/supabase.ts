import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/** 2 台をつなぐ固定のチャンネル名（ペアの認証は T4 で行う） */
export const SYNC_CHANNEL_NAME = 'window-pair-demo';

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
