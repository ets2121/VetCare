// models/petPassportEntry.model.ts

export type PassportEntryType =
  | 'VACCINE'
  | 'CHECKUP'
  | 'SURGERY'
  | 'MEDICATION'
  | 'OTHER';

export interface PetPassportEntry {
  entry_id: string;
  // PRIMARY KEY

  pet_id: string | null;
  // FOREIGN KEY → pets.pet_id

  brand_id: string | null;
  // FOREIGN KEY → brands.brand_id

  branch_id: string | null;
  // FOREIGN KEY → branches.branch_id

  staff_id: string | null;
  // FOREIGN KEY → users.user_id

  entry_type: PassportEntryType | null;
  // Enum constraint

  title: string | null;
  // Entry title

  notes: string | null;
  // Detailed notes

  date_of_entry: string | null;
  // Date of procedure

  next_due_date: string | null;
  // Optional follow-up date

  visible_to_owner: boolean;
  // Default: true

  created_at: string;
  // Timestamp

  updated_at: string;
  // Timestamp
}
