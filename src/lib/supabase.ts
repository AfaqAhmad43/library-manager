import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
  console.warn(
    'Supabase environment variables are missing or using placeholder values. ' +
    'Please rename .env.local.example to .env.local and update the values.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
