import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export const SESSION_COOKIE = 'sb-session';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes('placeholder')
) {
  console.warn(
    'Supabase environment variables are missing or using placeholder values. ' +
    'Please configure them in your environment or .env.local.'
  );
}

// Global static client for public or non-request contexts
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Creates an authenticated Supabase client for Server Actions and Server Components
 * by forwarding the JWT access token from the HTTP-only cookie.
 */
export async function getSupabaseServerClient() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  });
}
