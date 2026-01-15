import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { UserRole } from '@/models';
import { AppointmentService } from '@/services/appointment.service';
import { AppointmentCreateSchema } from '@/models';

const AppointmentCreateValidation = AppointmentCreateSchema.omit({
  status: true,
  payment_status: true,
  created_by: true,
});

function hasRole(requiredRoles: UserRole[], actualRole?: string): boolean {
  if (!actualRole) return false;
  return requiredRoles.includes(actualRole as UserRole);
}

export const appointmentController = {
  // GET /api/appointments/available-dates
  async getAvailableDates(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const branch_id = searchParams.get('branch_id');
      const service_id = searchParams.get('service_id');

      if (!branch_id || !service_id) {
        return NextResponse.json({ error: 'Missing branch_id or service_id' }, { status: 400 });
      }

      const service = new AppointmentService(
        session.brand_id,
        session.user_id!,
        session.role!,
        session.branch_id
      );

      const dates = await service.getAvailableDates(branch_id, service_id);
      return NextResponse.json({ available_dates: dates }, { status: 200 });
    } catch (error) {
      console.error('GET /appointments/available-dates error:', error);
      return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
  },

  // GET /api/appointments/available-slots
  async getAvailableSlots(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const branch_id = searchParams.get('branch_id');
      const service_id = searchParams.get('service_id');
      const date = searchParams.get('date');

      if (!branch_id || !service_id || !date) {
        return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
      }

      const service = new AppointmentService(
        session.brand_id,
        session.user_id!,
        session.role!,
        session.branch_id
      );

      const slots = await service.getAvailableSlots(branch_id, service_id, date);
      return NextResponse.json({ available_slots: slots }, { status: 200 });
    } catch (error) {
      console.error('GET /appointments/available-slots error:', error);
      return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
  },

  // GET /api/appointments/upcoming
  async getUpcoming(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasRole([UserRole.STAFF, UserRole.ADMIN, UserRole.SUPER_ADMIN], session.role)) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const branch_id = searchParams.get('branch_id') || session.branch_id;
      if (!branch_id) {
        return NextResponse.json({ error: 'Branch ID required' }, { status: 400 });
      }

      const service = new AppointmentService(
        session.brand_id,
        session.user_id!,
        session.role!,
        session.branch_id
      );

      const appointments = await service.getUpcoming(branch_id);
      return NextResponse.json(appointments, { status: 200 });
    } catch (error) {
      console.error('GET /appointments/upcoming error:', error);
      return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 });
    }
  },

  // GET /api/appointments
  async list(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const service = new AppointmentService(
        session.brand_id,
        session.user_id!,
        session.role!,
        session.branch_id
      );

      const appointments = await service.list();
      return NextResponse.json(appointments, { status: 200 });
    } catch (error) {
      console.error('GET /appointments error:', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  },

  // POST /api/appointments
  async create(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await req.json();
      const validated = AppointmentCreateValidation.parse(body);

      const service = new AppointmentService(
        session.brand_id,
        session.user_id!,
        session.role!,
        session.branch_id
      );

      // For customers, auto-set owner_id
      if (session.role === UserRole.CUSTOMER) {
        validated.owner_id = session.user_id!;
      }

      const appointment = await service.create(validated);
      return NextResponse.json(appointment, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      console.error('POST /appointments error:', error);
      return NextResponse.json({ error: error.message || 'Failed to create appointment' }, { status: 400 });
    }
  },

  // GET /api/appointments/:id
  async getById(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const service = new AppointmentService(
        session.brand_id,
        session.user_id!,
        session.role!,
        session.branch_id
      );

      const appointment = await service.getById(params.id);
      if (!appointment) {
        return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
      }

      return NextResponse.json(appointment, { status: 200 });
    } catch (error) {
      console.error('GET /appointments/:id error:', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  },

  // PUT /api/appointments/:id
  async update(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasRole([UserRole.STAFF, UserRole.ADMIN, UserRole.SUPER_ADMIN], session.role)) {
        return NextResponse.json({ error: 'Only staff can update appointments' }, { status: 403 });
      }

      const body = await req.json();
      const validated = AppointmentCreateSchema.partial().parse(body);

      const service = new AppointmentService(
        session.brand_id,
        session.user_id!,
        session.role!,
        session.branch_id
      );

      const appointment = await service.update(params.id, validated);
      return NextResponse.json(appointment, { status: 200 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      console.error('PUT /appointments/:id error:', error);
      return NextResponse.json({ error: error.message || 'Failed to update appointment' }, { status: 400 });
    }
  },

  // PATCH /api/appointments/:id/cancel
  async cancel(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (
        session.role !== UserRole.CUSTOMER &&
        !hasRole([UserRole.STAFF, UserRole.ADMIN, UserRole.SUPER_ADMIN], session.role)
      ) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 });
      }

      const service = new AppointmentService(
        session.brand_id,
        session.user_id!,
        session.role!,
        session.branch_id
      );

      await service.cancel(params.id);
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('PATCH /appointments/:id/cancel error:', error);
      return NextResponse.json({ error: error.message || 'Failed to cancel appointment' }, { status: 400 });
    }
  },

  // POST /api/appointments/:id/resend-notification
  async resendNotification(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN], session.role)) {
        return NextResponse.json({ error: 'Only admins can resend notifications' }, { status: 403 });
      }

      const service = new AppointmentService(
        session.brand_id,
        session.user_id!,
        session.role!,
        session.branch_id
      );

      await service.resendNotification(params.id);
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('POST /appointments/:id/resend-notification error:', error);
      return NextResponse.json({ error: error.message || 'Failed to resend notification' }, { status: 400 });
    }
  }
};