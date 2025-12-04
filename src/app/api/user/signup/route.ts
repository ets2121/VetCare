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
    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters.' }, { status: 400 });
    }
     if (!process.env.BRAND_ID) {
      return NextResponse.json({ error: 'Application is not configured with a brand ID.' }, { status: 500 });
    }

    const supabase = createClient();
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const { data: newUser, error: insertError } = await supabase.from('users').insert({
      email: email,
      password_hash,
      username: email.split('@')[0], 
      full_name: '',
      role: 'CUSTOMER',
      brand_id: process.env.BRAND_ID,
    }).select('user_id, role, brand_id, branch_id').single();

    if (insertError || !newUser) {
      if (insertError?.message.includes('unique constraint')) {
        return NextResponse.json({ error: 'Could not sign up user. This email may already be in use.' }, { status: 409 });
      }
      console.error('Failed to insert user into public.users:', insertError);
      return NextResponse.json({ error: 'Could not create user profile.' }, { status: 500 });
    }

    const session = await getIronSession<SessionData>(cookies(), sessionOptions);
    session.user_id = newUser.user_id;
    session.role = newUser.role;
    session.brand_id = newUser.brand_id;
    session.branch_id = newUser.branch_id;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ message: 'Signup successful', redirectUrl: '/dashboard' }, { status: 201 });

  } catch (error) {
    console.error('Signup API Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 });
  }
}
