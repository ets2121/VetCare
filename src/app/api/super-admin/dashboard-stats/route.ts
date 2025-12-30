import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getIronSession } from 'iron-session';
import { SessionData, sessionOptions } from '@/lib/session';
import { cookies } from 'next/headers';
import { z } from 'zod';

const thirtyDaysAgo = new Date();
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

// Zod schemas for safe parsing
const RoleSchema = z.enum(['ADMIN', 'STAFF', 'CUSTOMER', 'SUPER_ADMIN']);
const AppointmentStatusSchema = z.enum(['SCHEDULED', 'COMPLETED', 'CANCELED', 'CONFIRMED']);

export async function GET() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (!session.isLoggedIn || session.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const brandId = session.brand_id;

  if (!brandId) {
    return NextResponse.json({ error: 'Brand ID not found in session.' }, { status: 400 });
  }

  try {
    // --- Parallel Data Fetching --- 
    const [ 
      brandData, 
      branchesCount, 
      usersData, 
      appointmentsData, 
      appointmentsTrendData 
    ] = await Promise.all([
      // 1. Fetch Brand Name
      supabase.from('brands').select('name').eq('brand_id', brandId).single(),
      // 2. Fetch Total Branches
      supabase.from('branches').select('', { count: 'exact', head: true }).eq('brand_id', brandId),
      // 3. Fetch User Overview
      supabase.from('users').select('role').eq('brand_id', brandId),
      // 4. Fetch Appointments Overview
      supabase.from('appointments').select('status').eq('brand_id', brandId),
      // 5. Fetch Appointments Trend (Last 30 days)
      supabase.from('appointments').select('created_at').eq('brand_id', brandId).gte('created_at', thirtyDaysAgo.toISOString())
    ]);

    // --- Error Handling for Parallel Queries ---
    if (brandData.error) throw new Error(`Failed to fetch brand name: ${brandData.error.message}`);
    if (branchesCount.error) throw new Error(`Failed to fetch branches count: ${branchesCount.error.message}`);
    if (usersData.error) throw new Error(`Failed to fetch users: ${usersData.error.message}`);
    if (appointmentsData.error) throw new Error(`Failed to fetch appointments: ${appointmentsData.error.message}`);
    if (appointmentsTrendData.error) throw new Error(`Failed to fetch appointments trend: ${appointmentsTrendData.error.message}`);
    
    // --- Data Processing ---

    const userCounts = usersData.data.reduce((acc, user) => {
      acc.total++;
      const result = RoleSchema.safeParse(user.role);
      if (result.success) {
        acc[result.data] = (acc[result.data] || 0) + 1;
      }
      return acc;
    }, { total: 0, ADMIN: 0, STAFF: 0, CUSTOMER: 0, SUPER_ADMIN: 0 });

    const appointmentCounts = appointmentsData.data.reduce((acc, app) => {
        acc.total++;
        const result = AppointmentStatusSchema.safeParse(app.status);
        if (result.success) {
            acc[result.data] = (acc[result.data] || 0) + 1;
        }
        return acc;
    }, { total: 0, SCHEDULED: 0, COMPLETED: 0, CANCELED: 0, CONFIRMED: 0 });

    const trend = appointmentsTrendData.data.reduce((acc, item) => {
      const date = new Date(item.created_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const appointmentTrend = Object.entries(trend).map(([date, count]) => ({ date, count })).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const stats = {
      brandName: brandData.data.name,
      totalBranches: branchesCount.count ?? 0,
      userCounts,
      appointmentCounts,
      appointmentTrend,
    };

    return NextResponse.json(stats);

  } catch (error) {
    console.error('Super Admin Stats API Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred.';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
