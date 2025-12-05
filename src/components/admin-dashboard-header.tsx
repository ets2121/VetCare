'use client';

import { Logo } from './logo';
import { Button } from './ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { logout } from '@/app/auth/actions';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Menu, ShieldCheck, Users, Briefcase, Building, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getSession } from '@/lib/session';
import { useEffect, useState } from 'react';
import { SessionData } from '@/lib/session';


const adminNavLinks = [
  { href: '/admin/dashboard', label: 'Overview', icon: <Briefcase className="h-4 w-4" /> },
  { href: '/admin/appointments', label: 'Appointments', icon: <Briefcase className="h-4 w-4" /> },
  { href: '/admin/staff', label: 'Staff', icon: <Users className="h-4 w-4" /> },
  { href: '/admin/services', label: 'Services', icon: <Briefcase className="h-4 w-4" /> },
  { href: '/admin/clients', label: 'Clients', icon: <Users className="h-4 w-4" /> },
];

const superAdminNavLinks = [
  { href: '/super-admin/dashboard', label: 'Overview', icon: <ShieldCheck className="h-4 w-4" /> },
  { href: '/super-admin/brands', label: 'Brands', icon: <ShieldCheck className="h-4 w-4" /> },
  { href: '/super-admin/branches', label: 'All Branches', icon: <Building className="h-4 w-4" /> },
];

export function AdminDashboardHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState<SessionData | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
        const res = await fetch('/api/session');
        if (res.ok) {
            const data = await res.json();
            setSession(data);
        }
    }
    fetchSession();
  }, []);

  const navLinks = session?.role === 'SUPER_ADMIN' ? superAdminNavLinks : adminNavLinks;


  const NavLink = ({ href, children }: { href: string, children: React.ReactNode }) => (
    <Link
      href={href}
      onClick={() => setOpen(false)}
      className={cn(
        'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
        pathname === href
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
      )}
    >
      {children}
    </Link>
  );

  return (
    <header className="bg-background/80 backdrop-blur-sm shadow-sm sticky top-0 z-40">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">
        <Logo />
        <nav className="hidden items-center gap-4 text-sm font-medium md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'transition-colors hover:text-accent-foreground',
                pathname === link.href ? 'text-accent-foreground font-semibold' : 'text-muted-foreground'
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <form action={logout} className="hidden md:block">
            <Button variant="outline" type="submit">
              Logout
            </Button>
          </form>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Open Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[360px]">
              <SheetHeader className="p-4">
                  <SheetTitle><Logo /></SheetTitle>
              </SheetHeader>
              <div className="p-4">
                <div className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                     <NavLink key={link.href} href={link.href}>
                        {link.icon}
                        <span>{link.label}</span>
                    </NavLink>
                  ))}
                </div>
                <div className="mt-6 border-t pt-6">
                  <form action={logout}>
                    <Button variant="outline" type="submit" className="w-full justify-start gap-2">
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </form>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
