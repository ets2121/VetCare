// models/pet.model.ts

export type PetSex = 'male' | 'female' | 'unknown';

export interface Pet {
  pet_id: string;
  // PRIMARY KEY

  owner_id: string | null;
  // FOREIGN KEY → users.user_id
  // Owner of the pet

  brand_id: string | null;
  // FOREIGN KEY → brands.brand_id

  branch_id: string | null;
  // FOREIGN KEY → branches.branch_id

  name: string;
  // Required
  // Pet name

  species: string | null;
  // e.g. Dog, Cat

  breed: string | null;
  // Optional

  sex: PetSex | null;
  // Enum constraint

  dob: string | null;
  // Date of birth

  color: string | null;
  // Optional

  weight_kg: number | null;
  // Weight in kilograms

  microchip_id: string | null;
  // UNIQUE
  // Pet microchip identifier

  status: string;
  // Default: 'active'

  created_at: string;
  // Timestamp

  updated_at: string;
  // Timestamp
}
