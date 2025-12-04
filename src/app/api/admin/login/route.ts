import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const supabase = createClient();

  // Fetch user from your public.users table
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('user_id, email, password_hash, role')
    .eq('email', email)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: 'Invalid credentials. Please try again.' }, { status: 401 });
  }

  // Verify password with bcrypt
  const isValidPassword = await bcrypt.compare(password, userData.password_hash);

  if (!isValidPassword) {
    return NextResponse.json({ error: 'Invalid credentials. Please try again.' }, { status: 401 });
  }

  const { role } = userData;

  // Check if the user is an admin
  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Access denied. Not an administrator.' }, { status: 403 });
  }

  // To manage sessions, we still need to interact with Supabase's auth system
  // to get a JWT. We will sign in the user here after we've verified their
  // password against our own hash. This assumes a user with this email
  // also exists in the auth.users table.
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    // This can happen if password in auth.users is out of sync with our password_hash
    // Or if the user doesn't exist in auth.users
    return NextResponse.json({ error: 'Failed to create a session. Please contact support.' }, { status: 500 });
  }

  let redirectUrl = '/admin/dashboard';
  if (role === 'SUPER_ADMIN') {
    redirectUrl = '/super-admin/dashboard';
  }

  return NextResponse.json({ message: 'Login successful', redirectUrl }, { status: 200 });
}
