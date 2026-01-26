import { NextRequest } from 'next/server';
import { notificationController } from '@/controllers/notification.controller';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return notificationController.markAsRead(request, { params });
}