import AppClientLayout from '@/components/layout/AppClientLayout';
import { getBrandName } from '@/lib/brand';
import { PawPrint } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

const Brand = () => {
    const brandName = getBrandName();
    const nameParts = brandName.split(' ');
    const mainTitle = nameParts.slice(0, 3).join(' ');
    const subTitle = nameParts.slice(3).join(' ');

    return (
        <Link href="/" className="flex items-center gap-2 font-semibold">
            <PawPrint className="h-6 w-6" />
            <div className="flex flex-col">
                <span>{mainTitle}</span>
                {subTitle && <span className="text-xs font-normal text-muted-foreground">{subTitle}</span>}
            </div>
        </Link>
    );
};

export default function SuperAdminDashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <AppClientLayout brandComponent={<Brand />}>
            {children}
        </AppClientLayout>
    );
}
