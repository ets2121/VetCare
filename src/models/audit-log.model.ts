import { z } from 'zod';
import { Timestamps } from './base.model';

export interface AuditLog extends Timestamps {
  log_id: string;
  brand_id: string | null;
  user_id: string | null;
  action: string;
  table_name: string;
  record_id: string | null;
  old_value: Record<string, any> | null; // jsonb
  new_value: Record<string, any> | null; // jsonb
}

export interface AuditLogCreateInput {
  brand_id?: string | null;
  user_id?: string | null;
  action: string;
  table_name: string;
  record_id?: string | null;
  old_value?: Record<string, any> | null;
  new_value?: Record<string, any> | null;
}

export const AuditLogCreateSchema = z.object({
  brand_id: z.string().uuid().optional().nullable(),
  user_id: z.string().uuid().optional().nullable(),
  action: z.string().min(1).max(100),
  table_name: z.string().min(1).max(100),
  record_id: z.string().uuid().optional().nullable(),
  old_value: z.record(z.any()).optional().nullable(),
  new_value: z.record(z.any()).optional().nullable(),
});

// Audit logs are typically insert-only
export const AuditLogUpdateSchema = z.never(); // Prevent updates