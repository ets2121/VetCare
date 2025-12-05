import { AdminDashboardHeader } from '@/components/admin-dashboard-header';

export default function SuperAdminDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <AdminDashboardHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
