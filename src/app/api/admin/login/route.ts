import { NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt';
import { createClient } from '@/lib/supabase/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';


export async function POST(request: Request) {
  const { email, password } = await request.json();
  const supabase = createClient();

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('user_id, email, password_hash, role, brand_id, branch_id')
    .eq('email', email)
    .eq('brand_id', process.env.BRAND_ID!)
    .single();

  if (userError || !userData) {
    return NextResponse.json({ error: 'Invalid credentials. Please try again.' }, { status: 401 });
  }

  const isValidPassword = await bcrypt.compare(password, userData.password_hash);

  if (!isValidPassword) {
    return NextResponse.json({ error: 'Invalid credentials. Please try again.' }, { status: 401 });
  }

  const { role } = userData;

  if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Access denied. Not an administrator.' }, { status: 403 });
  }

  const session = await getIronSession<SessionData>(cookies(), sessionOptions);
  session.user_id = userData.user_id;
  session.role = userData.role;
  session.brand_id = userData.brand_id;
  session.branch_id = userData.branch_id;
  session.isLoggedIn = true;
  await session.save();

  let redirectUrl = '/admin/dashboard';
  if (role === 'SUPER_ADMIN') {
    redirectUrl = '/super-admin/dashboard';
  }

  return NextResponse.json({ message: 'Login successful', redirectUrl }, { status: 200 });
}
