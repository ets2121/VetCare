import { NextRequest } from 'next/server';
import { appointmentController } from '@/controllers/appointment.controller';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return appointmentController.resendNotification(request, { params });
}