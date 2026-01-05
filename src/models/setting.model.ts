import { z } from 'zod';
import { Timestamps } from './base.model';

// Helper: time without time zone → string "HH:mm:ss"
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

export interface Setting extends Timestamps {
  settings_id: string;
  brand_id: string | null;
  branch_id: string | null;
  start_work_hour: string; // time → "08:00:00"
  end_work_hour: string;   // time → "17:00:00"
  timezone: string;
  max_daily_appointments: number | null;
  appointment_gap_minutes: number;
  allow_same_day_booking: boolean;
  booking_window_days: number;
  auto_confirm_bookings: boolean;
  notify_before_minutes: number;
  allow_walk_in: boolean;
  maintenance_mode: boolean;
  default_service_duration: number;
  holiday_dates: Record<string, any> | null; // jsonb
  timezone_offset: string;
  appointment_cancellation_window: number;
  require_pet_record: boolean;
  currency: string;
  booking_confirmation_message: string | null;
  no_show_penalty_enabled: boolean;
  slot_interval_minutes: number;
  max_pets_per_user_per_day: number | null;
  enable_waitlist: boolean;
  enable_notifications: boolean;
  contact_email: string | null;
  contact_phone: string | null;
  social_links: Record<string, any> | null; // jsonb
  branding_color_primary: string | null;
  branding_logo_url: string | null;
  custom_terms_and_conditions: string | null;
}

export interface SettingCreateInput {
  brand_id?: string | null;
  branch_id?: string | null;
  start_work_hour?: string;
  end_work_hour?: string;
  timezone?: string;
  max_daily_appointments?: number | null;
  appointment_gap_minutes?: number;
  allow_same_day_booking?: boolean;
  booking_window_days?: number;
  auto_confirm_bookings?: boolean;
  notify_before_minutes?: number;
  allow_walk_in?: boolean;
  maintenance_mode?: boolean;
  default_service_duration?: number;
  holiday_dates?: Record<string, any> | null;
  timezone_offset?: string;
  appointment_cancellation_window?: number;
  require_pet_record?: boolean;
  currency?: string;
  booking_confirmation_message?: string | null;
  no_show_penalty_enabled?: boolean;
  slot_interval_minutes?: number;
  max_pets_per_user_per_day?: number | null;
  enable_waitlist?: boolean;
  enable_notifications?: boolean;
  contact_email?: string | null;
  contact_phone?: string | null;
  social_links?: Record<string, any> | null;
  branding_color_primary?: string | null;
  branding_logo_url?: string | null;
  custom_terms_and_conditions?: string | null;
}

export const SettingCreateSchema = z.object({
  brand_id: z.string().uuid().optional().nullable(),
  branch_id: z.string().uuid().optional().nullable(),
  start_work_hour: z.string().regex(timeRegex).default('08:00:00'),
  end_work_hour: z.string().regex(timeRegex).default('17:00:00'),
  timezone: z.string().default('Asia/Manila'),
  max_daily_appointments: z.number().int().positive().optional().nullable(),
  appointment_gap_minutes: z.number().int().nonnegative().default(10),
  allow_same_day_booking: z.boolean().default(true),
  booking_window_days: z.number().int().positive().default(30),
  auto_confirm_bookings: z.boolean().default(false),
  notify_before_minutes: z.number().int().nonnegative().default(60),
  allow_walk_in: z.boolean().default(true),
  maintenance_mode: z.boolean().default(false),
  default_service_duration: z.number().int().positive().default(30),
  holiday_dates: z.record(z.any()).optional().nullable(),
  timezone_offset: z.string().default('+08:00'),
  appointment_cancellation_window: z.number().int().nonnegative().default(12),
  require_pet_record: z.boolean().default(false),
  currency: z.string().default('PHP'),
  booking_confirmation_message: z.string().max(5000).optional().nullable(),
  no_show_penalty_enabled: z.boolean().default(false),
  slot_interval_minutes: z.number().int().positive().default(30),
  max_pets_per_user_per_day: z.number().int().positive().optional().nullable(),
  enable_waitlist: z.boolean().default(false),
  enable_notifications: z.boolean().default(true),
  contact_email: z.string().email().optional().nullable(),
  contact_phone: z.string().max(50).optional().nullable(),
  social_links: z.record(z.any()).optional().nullable(),
  branding_color_primary: z.string().max(7).optional().nullable(), // #RRGGBB
  branding_logo_url: z.string().url().optional().nullable(),
  custom_terms_and_conditions: z.string().max(10000).optional().nullable(),
});

export const SettingUpdateSchema = SettingCreateSchema.partial();