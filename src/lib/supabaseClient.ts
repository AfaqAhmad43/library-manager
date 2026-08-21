import { createClient } from '@supabase/supabase-js';

/**
 * Client-side Supabase instance for use in Client Components.
 * Uses the same public env vars — safe to ship to the browser.
 */
const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Persist a resolved artwork URL directly to the database from the browser.
 * Returns true on success, false on failure (with a console error).
 */
export async function persistCoverUrl(id: string, cover_url: string): Promise<boolean> {
  console.log(`[CoverArt] Persisting cover_url for album ${id}:`, cover_url);

  const { error } = await supabaseClient
    .from('albums')
    .update({ cover_url })
    .eq('id', id);

  if (error) {
    console.error(`[CoverArt] ❌ Failed to persist cover_url for album ${id}:`, error.message, error);
    return false;
  }

  console.log(`[CoverArt] ✅ Successfully cached cover_url for album ${id}`);
  return true;
}
