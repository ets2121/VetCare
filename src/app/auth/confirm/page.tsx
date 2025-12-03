import { MailCheck } from 'lucide-react';

export default function AuthConfirmPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] text-center p-4">
      <MailCheck className="w-16 h-16 mb-4 text-green-500" />
      <h1 className="text-3xl font-bold mb-2">Check your email</h1>
      <p className="text-muted-foreground max-w-md">
        We've sent a confirmation link to your email address. Please click the link to complete your registration.
      </p>
    </div>
  );
}
