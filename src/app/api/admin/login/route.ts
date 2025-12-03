import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const { email, password } = await request.json();
  const supabase = createClient();

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return NextResponse.json({ error: 'Invalid credentials. Please try again.' }, { status: 401 });
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', authData.user.id)
    .single();

  if (userError || !userData) {
    await supabase.auth.signOut(); // Log out if user record not found
    return NextResponse.json({ error: 'User data not found.' }, { status: 404 });
  }

  const { role } = userData;

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    await supabase.auth.signOut(); // Log out non-admin users
    return NextResponse.json({ error: 'Access denied. Not an administrator.' }, { status: 403 });
  }
  
  let redirectUrl = '/admin/dashboard';
  if (role === 'SUPER_ADMIN') {
    redirectUrl = '/super-admin/dashboard';
  }

  return NextResponse.json({ message: 'Login successful', redirectUrl }, { status: 200 });
}
