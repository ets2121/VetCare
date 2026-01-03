// models/settings.model.ts

export interface Settings {
    settings_id: string;
    // PRIMARY KEY
  
    brand_id: string | null;
    // FOREIGN KEY → brands.brand_id
  
    branch_id: string | null;
    // FOREIGN KEY → branches.branch_id
  
    start_work_hour: string;
    // Default: 08:00
  
    end_work_hour: string;
    // Default: 17:00
  
    timezone: string;
    // Default: Asia/Manila
  
    max_daily_appointments: number | null;
  
    appointment_gap_minutes: number;
    // Default: 10
  
    allow_same_day_booking: boolean;
  
    booking_window_days: number | null;
  
    auto_confirm_bookings: boolean;
  
    notify_before_minutes: number;
  
    allow_walk_in: boolean;
  
    maintenance_mode: boolean;
  
    default_service_duration: number;
  
    holiday_dates: Record<string, any> | null;
    // JSONB
  
    timezone_offset: string;
  
    appointment_cancellation_window: number;
  
    require_pet_record: boolean;
  
    currency: string;
    // Default: PHP
  
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
  
    created_at: string;
    // Timestamp
  
    updated_at: string;
    // Timestamp
  }
  