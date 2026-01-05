import { z } from 'zod';
import { Timestamps } from './base.model';

export interface Brand extends Timestamps {
  brand_id: string;
  name: string;
  logo_url: string | null;
  email: string | null;
  phone: string | null;
  status: string; // DB: DEFAULT 'active' — no enum, so string
}

export interface BrandCreateInput {
  name: string;
  logo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string;
}

export interface BrandUpdateInput {
  name?: string;
  logo_url?: string | null;
  email?: string | null;
  phone?: string | null;
  status?: string;
}

export const BrandCreateSchema = z.object({
  name: z.string().min(1).max(255),
  logo_url: z.string().url().optional().nullable(),
  email: z.string().email().optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  status: z.string().default('active'),
});

export const BrandUpdateSchema = BrandCreateSchema.partial();