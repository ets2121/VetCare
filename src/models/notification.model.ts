import { z } from 'zod';
import { Timestamps } from './base.model';
import { NotificationType, NotificationPriority, NotificationStatus } from './enums/notification.enum';

export interface Notification extends Timestamps {
  notification_id: string;
  brand_id: string | null;
  branch_id: string | null;
  user_id: string | null;
  sender_id: string | null;
  notification_type: NotificationType;
  category: string | null;
  title: string | null;
  message: string | null;
  link_url: string | null;
  is_read: boolean;
  priority: NotificationPriority;
  visible_to_customer: boolean;
  visible_to_admin: boolean;
  status: NotificationStatus;
  read_at: string | null; // timestamptz
}

export interface NotificationCreateInput {
  brand_id?: string | null;
  branch_id?: string | null;
  user_id?: string | null;
  sender_id?: string | null;
  notification_type: NotificationType;
  category?: string | null;
  title?: string | null;
  message?: string | null;
  link_url?: string | null;
  is_read?: boolean;
  priority?: NotificationPriority;
  visible_to_customer?: boolean;
  visible_to_admin?: boolean;
  status?: NotificationStatus;
  read_at?: string | null;
}

export interface NotificationUpdateInput {
  brand_id?: string | null;
  branch_id?: string | null;
  user_id?: string | null;
  sender_id?: string | null;
  notification_type?: NotificationType;
  category?: string | null;
  title?: string | null;
  message?: string | null;
  link_url?: string | null;
  is_read?: boolean;
  priority?: NotificationPriority;
  visible_to_customer?: boolean;
  visible_to_admin?: boolean;
  status?: NotificationStatus;
  read_at?: string | null;
}

export const NotificationCreateSchema = z.object({
  brand_id: z.string().uuid().optional().nullable(),
  branch_id: z.string().uuid().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
  sender_id: z.string().uuid().optional().nullable(),
  notification_type: z.nativeEnum(NotificationType),
  category: z.string().max(100).optional().nullable(),
  title: z.string().max(255).optional().nullable(),
  message: z.string().max(2000).optional().nullable(),
  link_url: z.string().url().optional().nullable(),
  is_read: z.boolean().default(false),
  priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.NORMAL),
  visible_to_customer: z.boolean().default(true),
  visible_to_admin: z.boolean().default(true),
  status: z.nativeEnum(NotificationStatus).default(NotificationStatus.ACTIVE),
  read_at: z.string().datetime({ offset: true }).optional().nullable(),
});

export const NotificationUpdateSchema = NotificationCreateSchema.partial();