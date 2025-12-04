'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as bcrypt from 'bcrypt';
import { createClient } from '@/lib/supabase/server';
import { getSession, sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';
import { getIronSession } from 'iron-session';

export async function login(formData: FormData) {
  const supabase = createClient();
  const session = await getSession();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('user_id, password_hash, role, brand_id, branch_id')
    .eq('email', email)
    .single();

  if (userError || !user) {
    return { error: 'Could not authenticate user. Please check your credentials.' };
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);

  if (!isValidPassword) {
    return { error: 'Could not authenticate user. Please check your credentials.' };
  }

  if (user.role !== 'CUSTOMER') {
    return { error: 'Invalid credentials for this login form.' };
  }
  
  session.user_id = user.user_id;
  session.role = user.role;
  session.brand_id = user.brand_id;
  session.branch_id = user.branch_id;
  session.isLoggedIn = true;
  await session.save();

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const supabase = createClient();
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);

  // For now, let's assign a default brand_id. In a multi-tenant app, this would
  // come from the context of the signup form (e.g., a subdomain or a selection).
  // I will check the database for an existing brand and use it.
  const { data: brand } = await supabase.from('brands').select('brand_id').limit(1).single();
  if (!brand) {
      return { error: 'Could not create user profile. No brand available.' };
  }

  const { data: newUser, error: insertError } = await supabase.from('users').insert({
    email: email,
    password_hash,
    username: email.split('@')[0], 
    full_name: '',
    role: 'CUSTOMER',
    brand_id: brand.brand_id,
  }).select('user_id, role, brand_id, branch_id').single();

  if (insertError || !newUser) {
    if (insertError.message.includes('unique constraint')) {
      return { error: 'Could not sign up user. This email may already be in use.' };
    }
    console.error('Failed to insert user into public.users:', insertError);
    return { error: 'Could not create user profile.' };
  }

  const session = await getIronSession(cookies(), sessionOptions);
  session.user_id = newUser.user_id;
  session.role = newUser.role;
  session.brand_id = newUser.brand_id;
  session.branch_id = newUser.branch_id;
  session.isLoggedIn = true;
  await session.save();

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect('/login');
}
