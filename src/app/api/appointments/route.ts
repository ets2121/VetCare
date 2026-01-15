import { NextRequest } from 'next/server';
import { appointmentController } from '@/controllers/appointment.controller';

export async function GET(request: NextRequest) {
  return appointmentController.list(request);
}

export async function POST(request: NextRequest) {
  return appointmentController.create(request);
}