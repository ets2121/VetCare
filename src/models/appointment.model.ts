// models/appointment.model.ts

export type AppointmentStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED';

export interface Appointment {
  appointment_id: string;
  // PRIMARY KEY

  brand_id: string | null;
  // FOREIGN KEY → brands.brand_id

  branch_id: string | null;
  // FOREIGN KEY → branches.branch_id

  pet_id: string | null;
  // FOREIGN KEY → pets.pet_id

  owner_id: string | null;
  // FOREIGN KEY → users.user_id

  service_id: string | null;
  // FOREIGN KEY → services.service_id

  start_time: string;
  // Appointment start (timestamp)

  end_time: string;
  // Appointment end (timestamp)

  status: AppointmentStatus;
  // Enum constraint
  // Default: PENDING

  payment_status: string;
  // Default: UNPAID

  notes: string | null;
  // Optional notes

  created_by: string | null;
  // FOREIGN KEY → users.user_id
  // Staff/admin who created

  created_at: string;
  // Timestamp

  updated_at: string;
  // Timestamp
}
