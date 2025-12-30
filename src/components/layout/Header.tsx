'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { LogoutButton } from '@/components/layout/LogoutButton';

interface HeaderProps {
  navLinks: {
    href: string;
    label: string;
    icon: React.ReactNode;
  }[];
  brand: React.ReactNode;
}

export function Header({ navLinks, brand }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-muted/80 px-4 backdrop-blur-sm md:hidden">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 text-muted-foreground">
        {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        <span className="sr-only">Toggle navigation</span>
      </button>

      <div className="flex-1">{brand}</div>

      {isOpen && (
        <div className="fixed left-0 top-14 z-20 flex h-[calc(100vh-56px)] w-full flex-col bg-muted p-4">
          <nav className="flex flex-1 flex-col gap-2">
            {navLinks.map((link) => {
              const isActive = pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${isActive ? 'bg-muted text-primary' : ''}`}>
                  {link.icon}
                  {link.label}
                </Link>
              );
            })}
            <div className="mt-4">
              <LogoutButton />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
