import { z } from 'zod';
import { Timestamps } from './base.model';
import { PetSex, PetStatus } from './enums/pet.enum';

export interface Pet extends Timestamps {
  pet_id: string;
  owner_id: string;
  brand_id: string | null;
  branch_id: string | null;
  name: string;
  species: string | null;
  breed: string | null;
  sex: PetSex;
  dob: string | null; // date → "YYYY-MM-DD"
  color: string | null;
  weight_kg: number | null;
  microchip_id: string | null;
  status: PetStatus;
}

export interface PetCreateInput {
  owner_id: string;
  brand_id?: string | null;
  branch_id?: string | null;
  name: string;
  species?: string | null;
  breed?: string | null;
  sex: PetSex;
  dob?: string | null;
  color?: string | null;
  weight_kg?: number | null;
  microchip_id?: string | null;
  status?: PetStatus;
}

export interface PetUpdateInput {
  owner_id?: string;
  brand_id?: string | null;
  branch_id?: string | null;
  name?: string;
  species?: string | null;
  breed?: string | null;
  sex?: PetSex;
  dob?: string | null;
  color?: string | null;
  weight_kg?: number | null;
  microchip_id?: string | null;
  status?: PetStatus;
}

export const PetCreateSchema = z.object({
  owner_id: z.string().uuid(),
  brand_id: z.string().uuid().optional().nullable(),
  branch_id: z.string().uuid().optional().nullable(),
  name: z.string().min(1).max(255),
  species: z.string().max(100).optional().nullable(),
  breed: z.string().max(100).optional().nullable(),
  sex: z.nativeEnum(PetSex),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(), // YYYY-MM-DD
  color: z.string().max(100).optional().nullable(),
  weight_kg: z.number().nonnegative().optional().nullable(),
  microchip_id: z.string().max(100).optional().nullable(),
  status: z.nativeEnum(PetStatus).default(PetStatus.ACTIVE),
});

export const PetUpdateSchema = PetCreateSchema.partial();