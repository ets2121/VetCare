import { createClient } from '@/lib/supabase/server';
import { getCachedSettings, setCachedSettings, clearSettingsCache } from '@/lib/settings-cache';

export interface BranchSettings {
  brand_id: string;
  branch_id: string;
  start_work_hour: string;
  end_work_hour: string;
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
  holiday_dates: Record<string, any> | null;
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
  social_links: Record<string, any> | null;
  branding_color_primary: string | null;
  branding_logo_url: string | null;
  custom_terms_and_conditions: string | null;
}

export class SettingsService {
  private supabase = createClient();

  async getBranchSettings(brand_id: string, branch_id: string): Promise<BranchSettings> {
    // Try cache first
    const cached = getCachedSettings(brand_id, branch_id);
    if (cached) {
      return cached;
    }

    const { data, error } = await this.supabase
      .from('settings')
      .select('*')
      .eq('brand_id', brand_id)
      .eq('branch_id', branch_id)
      .single();

    if (error) {
      // Return defaults if no settings found
      const defaults: BranchSettings = {
        brand_id,
        branch_id,
        start_work_hour: '08:00:00',
        end_work_hour: '17:00:00',
        timezone: 'Asia/Manila',
        max_daily_appointments: null,
        appointment_gap_minutes: 10,
        allow_same_day_booking: true,
        booking_window_days: 30,
        auto_confirm_bookings: false,
        notify_before_minutes: 60,
        allow_walk_in: true,
        maintenance_mode: false,
        default_service_duration: 30,
        holiday_dates: null,
        timezone_offset: '+08:00',
        appointment_cancellation_window: 12,
        require_pet_record: false,
        currency: 'PHP',
        booking_confirmation_message: null,
        no_show_penalty_enabled: false,
        slot_interval_minutes: 30,
        max_pets_per_user_per_day: null,
        enable_waitlist: false,
        enable_notifications: true,
        contact_email: null,
        contact_phone: null,
        social_links: null,
        branding_color_primary: null,
        branding_logo_url: null,
        custom_terms_and_conditions: null,
      };
      setCachedSettings(brand_id, branch_id, defaults);
      return defaults;
    }

    setCachedSettings(brand_id, branch_id, data);
    return data;
  }

  clearCache(brand_id: string, branch_id: string): void {
    clearSettingsCache(brand_id, branch_id);
  }
}