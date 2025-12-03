# Database Schema (Formatted)

```
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.appointments (
  appointment_id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid,
  branch_id uuid,
  pet_id uuid,
  owner_id uuid,
  service_id uuid,
  start_time timestamp with time zone NOT NULL,
  end_time timestamp with time zone NOT NULL,
  status character varying DEFAULT 'PENDING'::character varying CHECK (status::text = ANY (ARRAY['PENDING','CONFIRMED','CANCELLED','COMPLETED'])),
  payment_status character varying DEFAULT 'UNPAID',
  notes text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (appointment_id)
);

CREATE TABLE public.audit_logs (
  log_id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid,
  user_id uuid,
  action character varying,
  table_name character varying,
  record_id uuid,
  old_value jsonb,
  new_value jsonb,
  created_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (log_id)
);

CREATE TABLE public.branches (
  branch_id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid,
  name character varying NOT NULL,
  address text,
  phone character varying,
  status character varying DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (branch_id)
);

CREATE TABLE public.brands (
  brand_id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL,
  logo_url text,
  email character varying,
  phone character varying,
  status character varying DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (brand_id)
);

CREATE TABLE public.file_attachments (
  file_id uuid NOT NULL DEFAULT gen_random_uuid(),
  entry_id uuid,
  brand_id uuid,
  file_url text,
  file_type character varying,
  uploaded_by uuid,
  uploaded_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (file_id)
);

CREATE TABLE public.notifications (
  notification_id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid,
  branch_id uuid,
  user_id uuid,
  sender_id uuid,
  notification_type character varying CHECK (notification_type::text = ANY (ARRAY['APPOINTMENT','CUSTOMER_REQUEST','SYSTEM_ALERT','PASSPORT','GENERAL'])),
  category character varying,
  title character varying,
  message text,
  link_url text,
  is_read boolean DEFAULT false,
  priority character varying DEFAULT 'NORMAL',
  visible_to_customer boolean DEFAULT true,
  visible_to_admin boolean DEFAULT true,
  status character varying DEFAULT 'ACTIVE',
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  PRIMARY KEY (notification_id)
);

CREATE TABLE public.pet_passport_entries (
  entry_id uuid NOT NULL DEFAULT gen_random_uuid(),
  pet_id uuid,
  brand_id uuid,
  branch_id uuid,
  staff_id uuid,
  entry_type character varying CHECK (entry_type::text = ANY (ARRAY['VACCINE','CHECKUP','SURGERY','MEDICATION','OTHER'])),
  title character varying,
  notes text,
  date_of_entry date,
  next_due_date date,
  visible_to_owner boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (entry_id)
);

CREATE TABLE public.pets (
  pet_id uuid NOT NULL DEFAULT gen_random_uuid(),
  owner_id uuid,
  brand_id uuid,
  branch_id uuid,
  name character varying NOT NULL,
  species character varying,
  breed character varying,
  sex character varying CHECK (sex::text = ANY (ARRAY['male','female','unknown'])),
  dob date,
  color character varying,
  weight_kg numeric,
  microchip_id character varying UNIQUE,
  status character varying DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (pet_id)
);

CREATE TABLE public.services (
  service_id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid,
  name character varying NOT NULL,
  description text,
  duration_minutes integer DEFAULT 30,
  price numeric DEFAULT 0,
  active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (service_id)
);

CREATE TABLE public.settings (
  settings_id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid,
  branch_id uuid,
  start_work_hour time DEFAULT '08:00:00',
  end_work_hour time DEFAULT '17:00:00',
  timezone character varying DEFAULT 'Asia/Manila',
  max_daily_appointments integer,
  appointment_gap_minutes integer DEFAULT 10,
  allow_same_day_booking boolean DEFAULT true,
  booking_window_days integer DEFAULT 30,
  auto_confirm_bookings boolean DEFAULT false,
  notify_before_minutes integer DEFAULT 60,
  allow_walk_in boolean DEFAULT true,
  maintenance_mode boolean DEFAULT false,
  default_service_duration integer DEFAULT 30,
  holiday_dates jsonb,
  timezone_offset character varying DEFAULT '+08:00',
  appointment_cancellation_window integer DEFAULT 12,
  require_pet_record boolean DEFAULT false,
  currency character varying DEFAULT 'PHP',
  booking_confirmation_message text,
  no_show_penalty_enabled boolean DEFAULT false,
  slot_interval_minutes integer DEFAULT 30,
  max_pets_per_user_per_day integer,
  enable_waitlist boolean DEFAULT false,
  enable_notifications boolean DEFAULT true,
  contact_email character varying,
  contact_phone character varying,
  social_links jsonb,
  branding_color_primary character varying,
  branding_logo_url text,
  custom_terms_and_conditions text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (settings_id)
);

CREATE TABLE public.users (
  user_id uuid NOT NULL DEFAULT gen_random_uuid(),
  brand_id uuid,
  branch_id uuid,
  username character varying NOT NULL,
  email character varying NOT NULL UNIQUE,
  password_hash text NOT NULL,
  full_name character varying,
  phone character varying,
  role character varying CHECK (role::text = ANY (ARRAY['SUPER_ADMIN','ADMIN','STAFF','CUSTOMER'])),
  status character varying DEFAULT 'active',
  profile_photo text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  PRIMARY KEY (user_id)
);
```
