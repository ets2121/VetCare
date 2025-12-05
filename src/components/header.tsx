import { getSession } from '@/lib/session';
import { Logo } from './logo';
import { Button } from './ui/button';
import Link from 'next/link';
import { logout } from '@/app/auth/actions';

export async function Header() {
  const session = await getSession();

  return (
    <header className="bg-background shadow-sm sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/#services" className="transition-colors hover:text-accent">Services</Link>
          <Link href="/#about" className="transition-colors hover:text-accent">About Us</Link>
          <Link href="/#contact" className="transition-colors hover:text-accent">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          {session.isLoggedIn ? (
            <>
              <Button asChild variant="ghost">
                <Link href={session.role === 'CUSTOMER' ? '/dashboard' : session.role === 'ADMIN' ? '/admin/dashboard' : '/super-admin/dashboard'}>Dashboard</Link>
              </Button>
              <form action={logout}>
                <Button variant="outline" type="submit">Logout</Button>
              </form>
            </>
          ) : (
            <>
              <Button asChild variant="ghost">
                <Link href="/login">Login</Link>
              </Button>
              <Button asChild style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
