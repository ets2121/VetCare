'use client';

import { Header } from '@/components/layout/Header';
import { SideNav } from '@/components/layout/SideNav';
import { Home, Calendar, PawPrint, User } from 'lucide-react';
import React from 'react';

const navLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
  { href: '/dashboard/appointments', label: 'Appointments', icon: <Calendar className="h-4 w-4" /> },
  { href: '/dashboard/pets', label: 'My Pets', icon: <PawPrint className="h-4 w-4" /> },
  { href: '/dashboard/profile', label: 'Profile', icon: <User className="h-4 w-4" /> },
];

export default function AppClientLayout({ children, brandComponent }: { children: React.ReactNode, brandComponent: React.ReactNode }) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:flex md:flex-col">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                {brandComponent}
            </div>
            <SideNav navLinks={navLinks} />
        </div>

        <div className="flex flex-col">
            <Header navLinks={navLinks} brand={brandComponent} />
            <main className="flex-1 overflow-y-auto p-4 sm:px-6 sm:py-0 md:p-8">
                {children}
            </main>
        </div>
    </div>
  );
}
