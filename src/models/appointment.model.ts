import { z } from 'zod';
import { Timestamps } from './base.model';
import { AppointmentStatus, PaymentStatus } from './enums/appointment.enum';

export interface Appointment extends Timestamps {
  appointment_id: string;
  brand_id: string | null;
  branch_id: string | null;
  pet_id: string;
  owner_id: string;
  service_id: string | null;
  start_time: string; // timestamptz → ISO string
  end_time: string;   // timestamptz → ISO string
  status: AppointmentStatus;
  payment_status: PaymentStatus;
  notes: string | null;
  created_by: string;
}

export interface AppointmentCreateInput {
  brand_id?: string | null;
  branch_id?: string | null;
  pet_id: string;
  owner_id: string;
  service_id?: string | null;
  start_time: string;
  end_time: string;
  status?: AppointmentStatus;
  payment_status?: PaymentStatus;
  notes?: string | null;
  created_by: string;
}

export interface AppointmentUpdateInput {
  brand_id?: string | null;
  branch_id?: string | null;
  pet_id?: string;
  owner_id?: string;
  service_id?: string | null;
  start_time?: string;
  end_time?: string;
  status?: AppointmentStatus;
  payment_status?: PaymentStatus;
  notes?: string | null;
  created_by?: string;
}

export const AppointmentCreateSchema = z.object({
  brand_id: z.string().uuid().optional().nullable(),
  branch_id: z.string().uuid().optional().nullable(),
  pet_id: z.string().uuid(),
  owner_id: z.string().uuid().optional(),
  service_id: z.string().uuid().optional().nullable(),
  start_time: z.string().datetime({ offset: true }), // Allows +08:00
  end_time: z.string().datetime({ offset: true }).optional(),
  status: z.nativeEnum(AppointmentStatus).default(AppointmentStatus.PENDING),
  payment_status: z.nativeEnum(PaymentStatus).default(PaymentStatus.UNPAID),
  notes: z.string().max(2000).optional().nullable(),
  created_by: z.string().uuid(),
});

export const AppointmentUpdateSchema = AppointmentCreateSchema.partial();