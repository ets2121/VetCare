import { z } from 'zod';
import { Timestamps } from './base.model';
import { PassportEntryType } from './enums/passport-entry.enum';

export interface PetPassportEntry extends Timestamps {
  entry_id: string;
  pet_id: string;
  brand_id: string;
  branch_id: string | null;
  staff_id: string | null;
  entry_type: PassportEntryType;
  title: string | null;
  notes: string | null;
  date_of_entry: string | null; // date → "YYYY-MM-DD"
  next_due_date: string | null; // date → "YYYY-MM-DD"
  visible_to_owner: boolean;
}

export interface PetPassportEntryCreateInput {
  pet_id: string;
  brand_id: string;
  branch_id?: string | null;
  staff_id?: string | null;
  entry_type: PassportEntryType;
  title?: string | null;
  notes?: string | null;
  date_of_entry?: string | null;
  next_due_date?: string | null;
  visible_to_owner?: boolean;
}

export interface PetPassportEntryUpdateInput {
  pet_id?: string;
  brand_id?: string;
  branch_id?: string | null;
  staff_id?: string | null;
  entry_type?: PassportEntryType;
  title?: string | null;
  notes?: string | null;
  date_of_entry?: string | null;
  next_due_date?: string | null;
  visible_to_owner?: boolean;
}

export const PetPassportEntryCreateSchema = z.object({
  pet_id: z.string().uuid(),
  brand_id: z.string().uuid(),
  branch_id: z.string().uuid().optional().nullable(),
  staff_id: z.string().uuid().optional().nullable(),
  entry_type: z.nativeEnum(PassportEntryType),
  title: z.string().max(255).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  date_of_entry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  next_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  visible_to_owner: z.boolean().default(true),
});

export const PetPassportEntryUpdateSchema = PetPassportEntryCreateSchema.partial();