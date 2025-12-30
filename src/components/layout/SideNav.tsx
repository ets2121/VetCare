'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { logout } from '@/app/auth/actions';

interface SideNavProps {
  navLinks: {
    href: string;
    label: string;
    icon: React.ReactNode;
  }[];
}

export function SideNav({ navLinks }: SideNavProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden h-full flex-col border-r bg-muted/40 md:flex">
      <nav className="flex flex-1 flex-col gap-2 p-4">
        {navLinks.map((link) => {
          const isActive = pathname.startsWith(link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? 'bg-muted text-primary' : ''}`}>
              {link.icon}
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-4">
        <form action={logout}>
          <Button variant="outline" type="submit" className="w-full justify-start gap-2">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </form>
      </div>
    </aside>
  );
}
