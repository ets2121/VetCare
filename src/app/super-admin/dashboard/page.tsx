'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Users, Calendar, UserCheck } from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, Sector
} from 'recharts';

interface DashboardStats {
  brandName: string;
  totalBranches: number;
  userCounts: {
    total: number;
    ADMIN: number;
    STAFF: number;
    CUSTOMER: number;
    SUPER_ADMIN: number;
  };
  appointmentCounts: {
    total: number;
    SCHEDULED: number;
    COMPLETED: number;
    CANCELED: number;
    CONFIRMED: number;
  };
  appointmentTrend: { date: string; count: number }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export default function SuperAdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/super-admin/dashboard-stats');
        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            router.push('/admin/login');
          } else {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch dashboard stats');
          }
          return;
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, [router]);

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center">Loading dashboard...</div>;
  }

  if (error) {
    return <div className="container mx-auto p-4 text-center text-red-500">Error: {error}</div>;
  }

  if (!stats) {
    return <div className="container mx-auto p-4 text-center">No data available.</div>;
  }

  const userData = [
    { name: 'Customers', value: stats.userCounts.CUSTOMER },
    { name: 'Staff', value: stats.userCounts.STAFF },
    { name: 'Admins', value: stats.userCounts.ADMIN + stats.userCounts.SUPER_ADMIN },
  ].filter(item => item.value > 0);

  const appointmentData = [
    { name: 'Scheduled', value: stats.appointmentCounts.SCHEDULED },
    { name: 'Completed', value: stats.appointmentCounts.COMPLETED },
    { name: 'Canceled', value: stats.appointmentCounts.CANCELED },
    { name: 'Confirmed', value: stats.appointmentCounts.CONFIRMED },
  ].filter(item => item.value > 0);

  return (
    <div className="container mx-auto p-4 md:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Super Admin Dashboard</h1>
        <p className="text-muted-foreground">Welcome to {stats.brandName}. Brand-wide overview.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Branches</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBranches}</div>
            <p className="text-xs text-muted-foreground">Branches in {stats.brandName}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.userCounts.CUSTOMER}</div>
            <p className="text-xs text-muted-foreground">Total users: {stats.userCounts.total}</p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={150}>
              <PieChart>
                <Pie data={userData} innerRadius={40} outerRadius={60} fill="#8884d8" paddingAngle={5} dataKey="value" nameKey="name">
                  {userData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(value) => `${value} users`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-5">
        <div className="md:col-span-2">
            <Card>
                <CardHeader>
                    <CardTitle>Appointments Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie data={appointmentData} innerRadius={60} outerRadius={90} fill="#8884d8" paddingAngle={5} dataKey="value" nameKey="name">
                                {appointmentData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(value) => `${value} appointments`} />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>

        <div className="md:col-span-3">
            <Card>
                <CardHeader>
                    <CardTitle>Appointments Trend (Last 30 Days)</CardTitle>
                </CardHeader>
                <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.appointmentTrend}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Line type="monotone" dataKey="count" stroke="#8884d8" name="New Appointments" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
