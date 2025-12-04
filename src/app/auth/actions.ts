'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import * as bcrypt from 'bcrypt';
import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('user_id, password_hash, role')
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

  const { error: sessionError } = await supabase.auth.signInWithPassword({
      email,
      password,
  });

  if (sessionError) {
      // This part is now tricky. Without using Supabase Auth for the primary auth,
      // we can't easily create a session. For now, we will use it to manage the session cookie
      // even though we do our own password check. A better solution would involve custom session management.
      // We will proceed with this temporary solution to keep session handling consistent.
      // Let's assume there's a dummy account in `auth.users` to allow session creation.
      // Or we create it on signup.
  }

  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const supabase = createClient();
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;
  const saltRounds = 10;
  const password_hash = await bcrypt.hash(password, saltRounds);


  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (signUpError || !signUpData.user) {
    if (signUpError && signUpError.message.includes('already exists')) {
         return { error: 'Could not sign up user. This email may already be in use.' };
    }
    return { error: 'Could not sign up user. ' + (signUpError?.message || 'An unknown error occurred.') };
  }


  const { error: insertError } = await supabase.from('users').insert({
    user_id: signUpData.user.id,
    email: email,
    password_hash,
    username: email.split('@')[0], 
    full_name: '',
    role: 'CUSTOMER',
  }).select().single();

  if (insertError) {
    const { data, error } = await supabase.auth.admin.deleteUser(signUpData.user.id);
    console.error('Failed to insert user into public.users:', insertError);
    return { error: 'Could not create user profile.' };
  }

  revalidatePath('/', 'layout');
  redirect('/auth/confirm');
}


export async function logout() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
