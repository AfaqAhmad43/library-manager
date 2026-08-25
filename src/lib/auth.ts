'use server';

import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SESSION_COOKIE } from './supabase';

const supabaseUrl     = process.env.NEXT_PUBLIC_SUPABASE_URL     || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// The designated single authorized email address allowed to access the app
const ALLOWED_EMAIL = process.env.ALLOWED_EMAIL || 'superpsycho4347@gmail.com';

/** Create a server-side Supabase client that can read/write cookies. */
function createServerClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ─────────────────────────────────────────────
//  SIGN IN (Server Action)
// ─────────────────────────────────────────────
export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ success: boolean; error?: string }> {
  // 1. Single-User Access Guard: check email before attempting sign-in
  if (email.trim().toLowerCase() !== ALLOWED_EMAIL.toLowerCase()) {
    return { success: false, error: 'Access denied: Unauthorized email address.' };
  }

  const supabase = createServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return { success: false, error: error?.message || 'Invalid credentials.' };
  }

  // Store the access token in a secure HttpOnly cookie so the proxy can read it
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, data.session.access_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: data.session.expires_in ?? 3600,
  });

  return { success: true };
}

// ─────────────────────────────────────────────
//  SIGN OUT (Server Action)
// ─────────────────────────────────────────────
export async function signOut(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect('/login');
}

// ─────────────────────────────────────────────
//  GET SESSION (for Server Components / actions)
// ─────────────────────────────────────────────
export async function getSession(): Promise<{ userId: string; email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    // Verify the JWT by calling Supabase's getUser with the token
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;
    return { userId: data.user.id, email: data.user.email ?? '' };
  } catch {
    return null;
  }
}
