'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export async function login(formData: FormData) {
  const supabase = createClient();

  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (authError || !authData.user) {
    return { error: 'Could not authenticate user. Please check your credentials.' };
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role')
    .eq('user_id', authData.user.id)
    .single();

  if (userError || !userData) {
    await supabase.auth.signOut(); // Log out if user record not found
    return { error: 'User data not found.' };
  }
  
  if (userData.role !== 'CUSTOMER') {
     await supabase.auth.signOut();
     return { error: 'Invalid credentials for this login form.' };
  }


  revalidatePath('/', 'layout');
  redirect('/dashboard');
}

export async function signup(formData: FormData) {
  const supabase = createClient();
  
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (signUpError || !signUpData.user) {
    return { error: 'Could not sign up user. This email may already be in use.' };
  }

  // Insert user into public.users table
  const { error: insertError } = await supabase.from('users').insert({
    user_id: signUpData.user.id,
    email: email,
    // You might want to get username and full_name from the form as well
    username: email.split('@')[0], 
    full_name: '',
    role: 'CUSTOMER',
  });

  if (insertError) {
    // If user insertion fails, it's a good practice to delete the auth user to keep things clean
    const { data, error } = await supabase.auth.admin.deleteUser(signUpData.user.id);
    if (error) {
        console.error('Failed to delete user from auth:', error);
    }
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
