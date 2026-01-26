import { NextRequest } from 'next/server';
import { notificationController } from '@/controllers/notification.controller';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return notificationController.delete(request, { params });
}