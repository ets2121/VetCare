import { NextRequest } from 'next/server';
import { appointmentController } from '@/controllers/appointment.controller';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return appointmentController.getById(request, { params });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return appointmentController.update(request, { params });
}