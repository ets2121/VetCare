import { z } from 'zod';
import { Timestamps } from './base.model';

export interface Branch extends Timestamps {
  branch_id: string;
  brand_id: string;
  name: string;
  address: string | null;
  phone: string | null;
  status: string; // DB: DEFAULT 'active'
}

export interface BranchCreateInput {
 // brand_id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
  status?: string;
}

export interface BranchUpdateInput {
  brand_id?: string;
  name?: string;
  address?: string | null;
  phone?: string | null;
  status?: string;
}

export const BranchCreateSchema = z.object({
 // brand_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  address: z.string().max(1000).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  status: z.string().default('active'),
});

export const BranchUpdateSchema = BranchCreateSchema.partial();