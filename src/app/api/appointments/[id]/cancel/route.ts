import { NextRequest } from 'next/server';
import { appointmentController } from '@/controllers/appointment.controller';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return appointmentController.cancel(request, { params });
}