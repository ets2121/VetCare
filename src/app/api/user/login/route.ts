import { NextResponse } from 'next/server';
import * as bcrypt from 'bcrypt';
import { createClient } from '@/lib/supabase/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    const supabase = createClient();

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_id, password_hash, role, brand_id, branch_id')
      .eq('email', email)
      .eq('brand_id', process.env.BRAND_ID!)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid credentials. Please try again.' }, { status: 401 });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash);

    if (!isValidPassword) {
      return NextResponse.json({ error: 'Invalid credentials. Please try again.' }, { status: 401 });
    }

    if (user.role !== 'CUSTOMER') {
      return NextResponse.json({ error: 'Access denied. Please use the admin portal.' }, { status: 403 });
    }

    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.user_id = user.user_id;
    session.role = user.role;
    session.brand_id = user.brand_id;
    session.branch_id = user.branch_id;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ message: 'Login successful', redirectUrl: '/dashboard' }, { status: 200 });

  } catch (error) {
    console.error('Login API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
