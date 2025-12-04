import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// This is a bare Supabase client. Do not use this for authenticated requests.
// This is useful for functions that do not require a user session, for example
// password reset, or for certain server-side operations.
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      db: {
        schema: 'public',
      },
    }
  );
}
