import { UserDashboardHeader } from '@/components/user-dashboard-header';

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col">
      <UserDashboardHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
