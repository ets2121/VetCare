/**
 * Notification Listing Service
 * 
 * Responsibilities:
 * - Apply role-based visibility filters
 * - Handle pagination and filtering
 * - Enrich notifications with sender details
 * - Count unread notifications
 */

import { createClient } from '@/lib/supabase/server';
import { Notification, NotificationStatus } from '@/models';

export interface NotificationWithSender extends Notification {
  sender_name?: string;
  sender_role?: string;
}

export interface NotificationFilters {
  is_read?: boolean;
  type?: string;
  after?: string;
  before?: string;
}

export class NotificationListService {
  private supabase = createClient();
  private brand_id: string;
  private user_id: string;
  private role: string;

  constructor(brand_id: string, user_id: string, role: string) {
    this.brand_id = brand_id;
    this.user_id = user_id;
    this.role = role;
  }

  /**
   * Get paginated notifications for the user
   */
  async list(
    page: number = 1,
    limit: number = 20,
    filters: NotificationFilters = {}
  ): Promise<{
    notifications: NotificationWithSender[];
    pagination: { total: number; page: number; limit: number; pages: number };
  }> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const offset = (page - 1) * safeLimit;

    // Build base query
    let query = this.supabase
      .from('notifications')
      .select(`
        *,
        sender:users!sender_id(full_name, role)
      `, { count: 'exact' })
      .eq('brand_id', this.brand_id)
      .eq('user_id', this.user_id);

    // Apply role visibility
    if (this.role === 'CUSTOMER') {
      query = query.eq('visible_to_customer', true);
    } else {
      query = query.eq('visible_to_admin', true);
    }

    // Apply status filter (only active notifications)
    query = query.eq('status', NotificationStatus.ACTIVE);

    // Apply filters
    if (filters.is_read !== undefined) {
      query = query.eq('is_read', filters.is_read);
    }
    if (filters.type) {
      query = query.eq('notification_type', filters.type);
    }
    if (filters.after) {
      query = query.gte('created_at', filters.after);
    }
    if (filters.before) {
      query = query.lte('created_at', filters.before);
    }

    // Execute query with pagination
    const { data, error, count } = await query
      .range(offset, offset + safeLimit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('NotificationListService.list error:', error);
      throw new Error(`Failed to fetch notifications: ${error.message}`);
    }

    const pages = count ? Math.ceil(count / safeLimit) : 0;

    // Enrich with sender details
    const enriched = data.map(notification => ({
      ...notification,
      sender_name: notification.sender?.full_name || null,
      sender_role: notification.sender?.role || null,
    })) as NotificationWithSender[];

    return {
      notifications: enriched,
      pagination: {
        total: count || 0,
        page,
        limit: safeLimit,
        pages,
      },
    };
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(): Promise<number> {
    let query = this.supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', this.brand_id)
      .eq('user_id', this.user_id)
      .eq('is_read', false)
      .eq('status', NotificationStatus.ACTIVE);

    if (this.role === 'CUSTOMER') {
      query = query.eq('visible_to_customer', true);
    } else {
      query = query.eq('visible_to_admin', true);
    }

    const { count, error } = await query;

    if (error) {
      console.error('NotificationListService.getUnreadCount error:', error);
      throw new Error(`Failed to count unread notifications: ${error.message}`);
    }

    return count || 0;
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(notification_id: string): Promise<string> {
    // Verify ownership and visibility
    const {data: existing, error: checkError } = await this.supabase
      .from('notifications')
      .select('notification_id')
      .eq('notification_id', notification_id)
      .eq('user_id', this.user_id)
      .eq('brand_id', this.brand_id)
      .eq('status', NotificationStatus.ACTIVE);

    if (checkError) {
      console.error('NotificationListService.markAsRead check error:', checkError);
      throw new Error('Failed to verify notification ownership');
    }

    if (!existing || existing.length === 0) {
      throw new Error('Notification not found or access denied');
    }

    const readAt = new Date().toISOString();
    const { error: updateError } = await this.supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: readAt 
      })
      .eq('notification_id', notification_id)
      .eq('user_id', this.user_id)
      .eq('brand_id', this.brand_id);

    if (updateError) {
      console.error('NotificationListService.markAsRead update error:', updateError);
      throw new Error('Failed to mark notification as read');
    }

    return readAt;
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<number> {
    let query = this.supabase
      .from('notifications')
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq('user_id', this.user_id)
      .eq('brand_id', this.brand_id)
      .eq('is_read', false)
      .eq('status', NotificationStatus.ACTIVE);

    if (this.role === 'CUSTOMER') {
      query = query.eq('visible_to_customer', true);
    } else {
      query = query.eq('visible_to_admin', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('NotificationListService.markAllAsRead error:', error);
      throw new Error('Failed to mark all notifications as read');
    }

    return data?.length || 0;
  }

  /**
   * Archive (soft delete) a notification
   */
  async archive(notification_id: string): Promise<void> {
    // Only SUPER_ADMIN can archive
    if (this.role !== 'SUPER_ADMIN') {
      throw new Error('Only SUPER_ADMIN can archive notifications');
    }

    const { error } = await this.supabase
      .from('notifications')
      .update({ status: NotificationStatus.ARCHIVED })
      .eq('notification_id', notification_id)
      .eq('brand_id', this.brand_id);

    if (error) {
      console.error('NotificationListService.archive error:', error);
      throw new Error('Failed to archive notification');
    }
  }
}