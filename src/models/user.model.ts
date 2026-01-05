import { z } from 'zod';
import { Timestamps } from './base.model';
import { UserRole, UserStatus } from './enums/user.enum';

export interface User extends Timestamps {
  user_id: string;
  brand_id: string | null;
  branch_id: string | null;
  username: string;
  email: string;
  // ⚠️ password_hash intentionally omitted from public interface
  full_name: string | null;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  profile_photo: string | null;
}

export interface UserCreateInput {
  brand_id?: string | null;
  branch_id?: string | null;
  username: string;
  email: string;
  password_hash: string; // Internal use only
  full_name?: string | null;
  phone?: string | null;
  role: UserRole;
  status?: UserStatus;
  profile_photo?: string | null;
}

export interface UserUpdateInput {
  brand_id?: string | null;
  branch_id?: string | null;
  username?: string;
  email?: string;
  password_hash?: string;
  full_name?: string | null;
  phone?: string | null;
  role?: UserRole;
  status?: UserStatus;
  profile_photo?: string | null;
}

export const UserCreateSchema = z.object({
  brand_id: z.string().uuid().optional().nullable(),
  branch_id: z.string().uuid().optional().nullable(),
  username: z.string().min(1).max(255),
  email: z.string().email(),
  password_hash: z.string().min(1),
  full_name: z.string().max(255).optional().nullable(),
  phone: z.string().max(50).optional().nullable(),
  role: z.nativeEnum(UserRole),
  status: z.nativeEnum(UserStatus).default(UserStatus.ACTIVE),
  profile_photo: z.string().url().optional().nullable(),
});

export const UserUpdateSchema = UserCreateSchema.partial();