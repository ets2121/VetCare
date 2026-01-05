import { z } from 'zod';
import { Timestamps } from './base.model';

export interface FileAttachment extends Timestamps {
  file_id: string;
  entry_id: string | null;
  brand_id: string | null;
  file_url: string;
  file_type: string | null;
  uploaded_by: string | null;
}

export interface FileAttachmentCreateInput {
  entry_id?: string | null;
  brand_id?: string | null;
  file_url: string;
  file_type?: string | null;
  uploaded_by?: string | null;
}

export interface FileAttachmentUpdateInput {
  entry_id?: string | null;
  brand_id?: string | null;
  file_url?: string;
  file_type?: string | null;
  uploaded_by?: string | null;
}

export const FileAttachmentCreateSchema = z.object({
  entry_id: z.string().uuid().optional().nullable(),
  brand_id: z.string().uuid().optional().nullable(),
  file_url: z.string().url(),
  file_type: z.string().max(50).optional().nullable(),
  uploaded_by: z.string().uuid().optional().nullable(),
});

export const FileAttachmentUpdateSchema = FileAttachmentCreateSchema.partial();