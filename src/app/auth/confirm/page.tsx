import { MailCheck } from 'lucide-react';
import { redirect } from 'next/navigation';

export default function AuthConfirmPage() {
    // This page is less relevant without email confirmation from Supabase Auth.
    // For now, redirecting to the dashboard as the user is logged in upon signup.
    redirect('/dashboard');

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center p-4">
      <MailCheck className="w-16 h-16 mb-4 text-green-500" />
      <h1 className="text-3xl font-bold mb-2">Registration Successful</h1>
      <p className="text-muted-foreground max-w-md">
        You are now logged in. Redirecting you to your dashboard...
      </p>
    </div>
  );
}
