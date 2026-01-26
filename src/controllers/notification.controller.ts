/**
 * Notification Controller
 * 
 * Role Rules:
 * - GET /notifications → All roles (filtered by visibility)
 * - GET /unread-count → All roles
 * - PATCH /:id/read → All roles (own notifications)
 * - PATCH /mark-all-read → All roles
 * - DELETE /:id → SUPER_ADMIN only
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { NotificationListService } from '@/services/notification-list.service';

// Validation schemas
const ListQuerySchema = z.object({
  page: z.string().optional().default('1'),
  limit: z.string().optional().default('20'),
  is_read: z.enum(['true', 'false']).optional(),
  type: z.string().optional(),
  after: z.string().datetime().optional(),
  before: z.string().datetime().optional(),
});

const MarkAllReadSchema = z.object({
  confirm: z.literal('all').optional(), // Safety check
});

export const notificationController = {
  // GET /api/notifications
  async list(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const { searchParams } = new URL(req.url);
      const queryParams = Object.fromEntries(searchParams.entries());
      
      const validated = ListQuerySchema.parse(queryParams);
      
      const filters: Parameters<typeof NotificationListService.prototype.list>[2] = {};
      if (validated.is_read) {
        filters.is_read = validated.is_read === 'true';
      }
      if (validated.type) {
        filters.type = validated.type;
      }
      if (validated.after) {
        filters.after = validated.after;
      }
      if (validated.before) {
        filters.before = validated.before;
      }

      const page = parseInt(validated.page, 10);
      const limit = parseInt(validated.limit, 10);

      const service = new NotificationListService(
        session.brand_id,
        session.user_id!,
        session.role!
      );

      const result = await service.list(page, limit, filters);
      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      console.error('GET /notifications error:', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  },

  // GET /api/notifications/unread-count
  async getUnreadCount(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const service = new NotificationListService(
        session.brand_id,
        session.user_id!,
        session.role!
      );

      const count = await service.getUnreadCount();
      return NextResponse.json({ unread_count: count }, { status: 200 });
    } catch (error) {
      console.error('GET /notifications/unread-count error:', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  },

  // PATCH /api/notifications/:id/read
  async markAsRead(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const service = new NotificationListService(
        session.brand_id,
        session.user_id!,
        session.role!
      );

      const readAt = await service.markAsRead(params.id);
      return NextResponse.json({ success: true, read_at: readAt }, { status: 200 });
    } catch (error) {
      console.error('PATCH /notifications/:id/read error:', error);
      return NextResponse.json({ error: error.message || 'Failed to mark as read' }, { status: 400 });
    }
  },

  // PATCH /api/notifications/mark-all-read
  async markAllAsRead(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const body = await req.json().catch(() => ({}));
      const validated = MarkAllReadSchema.parse(body);

      const service = new NotificationListService(
        session.brand_id,
        session.user_id!,
        session.role!
      );

      const markedCount = await service.markAllAsRead();
      return NextResponse.json({ success: true, marked_count: markedCount }, { status: 200 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      console.error('PATCH /notifications/mark-all-read error:', error);
      return NextResponse.json({ error: 'Failed to mark all as read' }, { status: 400 });
    }
  },

  // DELETE /api/notifications/:id
  async delete(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (session.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Only SUPER_ADMIN can delete notifications' }, { status: 403 });
      }

      const service = new NotificationListService(
        session.brand_id,
        session.user_id!,
        session.role!
      );

      await service.archive(params.id);
      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('DELETE /notifications/:id error:', error);
      return NextResponse.json({ error: error.message || 'Failed to delete notification' }, { status: 400 });
    }
  }
};