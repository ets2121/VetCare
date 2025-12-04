import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { getSession } from '@/lib/session';

// This is a server-side Supabase client.
// It is used for making requests to Supabase from Server Components, Server Actions, and Route Handlers.
// It is pre-configured with the user's access token if they are logged in.
export async function createClient() {
  const session = await getSession();

  // Note: The service role key is used here for elevated privileges.
  // This should be used with caution and only in server-side environments.
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    {
      db: {
        schema: 'public',
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
  
  return supabase;
}
