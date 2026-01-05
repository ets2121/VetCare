import { z } from 'zod';
import { Timestamps } from './base.model';

export interface Service extends Timestamps {
  service_id: string;
  brand_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  active: boolean;
}

export interface ServiceCreateInput {
  brand_id: string;
  name: string;
  description?: string | null;
  duration_minutes?: number;
  price?: number;
  active?: boolean;
}

export interface ServiceUpdateInput {
  brand_id?: string;
  name?: string;
  description?: string | null;
  duration_minutes?: number;
  price?: number;
  active?: boolean;
}

export const ServiceCreateSchema = z.object({
  brand_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  duration_minutes: z.number().int().positive().default(30),
  price: z.number().nonnegative().default(0),
  active: z.boolean().default(true),
});

export const ServiceUpdateSchema = ServiceCreateSchema.partial();