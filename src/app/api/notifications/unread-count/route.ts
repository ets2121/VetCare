import { NextRequest } from 'next/server';
import { notificationController } from '@/controllers/notification.controller';

export async function GET(request: NextRequest) {
  return notificationController.getUnreadCount(request);
}