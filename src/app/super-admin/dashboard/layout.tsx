'use client';

import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { SideNav } from '@/components/layout/SideNav';
import { Home, Building, Users, Settings, PawPrint } from 'lucide-react';

const navLinks = [
  { href: '/super-admin/dashboard', label: 'Dashboard', icon: <Home className="h-4 w-4" /> },
  { href: '/super-admin/dashboard/branches', label: 'Branches', icon: <Building className="h-4 w-4" /> },
  { href: '/super-admin/dashboard/staff', label: 'Staff', icon: <Users className="h-4 w-4" /> },
  { href: '/super-admin/dashboard/settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
];

const Brand = () => (
    <Link href="/" className="flex items-center gap-2 font-semibold">
        <PawPrint className="h-6 w-6" />
        <span>Pet Grooming</span>
    </Link>
);

export default function SuperAdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
        <div className="hidden border-r bg-muted/40 md:flex md:flex-col">
            <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
                <Brand />
            </div>
            <SideNav navLinks={navLinks} />
        </div>

        <div className="flex flex-col">
            <Header navLinks={navLinks} brand={<Brand />} />
            <main className="flex-1 overflow-y-auto p-4 sm:px-6 sm:py-0 md:p-8">
                {children}
            </main>
        </div>
    </div>
  );
}
