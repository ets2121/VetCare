/**
 * User Service Layer
 * 
 * Responsibilities:
 * - Enforce `brand_id` in all queries (multi-tenancy)
 * - Password hashing (bcrypt)
 * - Cascade deletes (integrity)
 * - Partial UUID extraction (`segment3`)
 * - Default settings creation for new admins
 * 
 * Security:
 * - Never expose `password_hash`
 * - Hard-delete related data on customer removal
 */

import { createClient } from '@/lib/supabase/server';
import { User, UserCreateInput, UserUpdateInput, UserRole } from '@/models';
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

export class UserService {
  private supabase = createClient();
  private brand_id: string;

  constructor(brand_id: string) {
    if (!brand_id) {
      throw new Error('UserService requires brand_id');
    }
    this.brand_id = brand_id;
  }

  /**
   * Extract 3rd segment of UUID (e.g., '4966' from 'fe80bed5-ec58-4966-82ab-6b612f7af824')
   */
  private extractSegment3(uuid: string): string {
    const parts = uuid.split('-');
    return parts.length >= 3 ? parts[2] : '';
  }

  /**
   * Get all users in brand — include `segment3` for frontend display
   */
  async getAll(): Promise<(User)[]> {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        user_id,
        brand_id,
        branch_id,
        username,
        email,
        full_name,
        phone,
        role,
        status,
        profile_photo,
        created_at,
        updated_at
      `)
      .eq('brand_id', this.brand_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('UserService.getAll error:', error);
      throw new Error(`Failed to fetch users: ${error.message}`);
    }

    return data.map(user => ({
      ...user,
    })) as (User)[];
  }

  /**
   * Get user by ID — include `segment3`
   */
  async getById(user_id: string): Promise<(User) | null> {
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        user_id,
        brand_id,
        branch_id,
        username,
        email,
        full_name,
        phone,
        role,
        status,
        profile_photo,
        created_at,
        updated_at
      `)
      .eq('user_id', user_id)
      .eq('brand_id', this.brand_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('UserService.getById error:', error);
      throw new Error(`Failed to fetch user: ${error.message}`);
    }

    return data
      ? { ...data}
      : null;
  }

  /**
   * Search users: by username, email, or partial UUID (segment3)
   * @param query string (username, email, or 4-digit segment)
   */
  async search(query: string): Promise<(User)[]> {
    // Try exact segment3 match first
    // const segment3Match = await this.supabase
    //   .from('users')
    //   .select(`
    //     user_id,
    //     brand_id,
    //     branch_id,
    //     username,
    //     email,
    //     full_name,
    //     phone,
    //     role,
    //     status,
    //     profile_photo,
    //     created_at,
    //     updated_at
    //   `)
    //   .eq('brand_id', this.brand_id) 
    //   .ilike('user_id',`%-42fa%-`); // ✅ Cast to text

    // if (segment3Match.data && segment3Match.data.length > 0) {
    //   return segment3Match.data.map(u => ({
    //     ...u,
    //     segment3: this.extractSegment3(u.user_id),
    //   })) as (User)[];
    // }

    // Fallback: search username/email
    const { data, error } = await this.supabase
      .from('users')
      .select(`
        user_id,
        brand_id,
        branch_id,
        username,
        email,
        full_name,
        phone,
        role,
        status,
        profile_photo,
        created_at,
        updated_at
      `)
      .eq('brand_id', this.brand_id)
      .or(`username.ilike.%${query}%,email.ilike.%${query}%`);

    if (error) {
      console.error('UserService.search error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }

    return data.map(u => ({
      ...u,
    })) as (User)[];
  }

  /**
   * Create customer user (role: CUSTOMER)
   * - branch_id = null
   * - password hashed
   */
  async createCustomer(input: Omit<UserCreateInput, 'role' | 'branch_id'>): Promise<User> {
    const hashedPassword = await bcrypt.hash(input.password_hash, SALT_ROUNDS);
    
    const insertData: UserCreateInput = {
      ...input,
      role: UserRole.CUSTOMER,
      branch_id: null,
      brand_id: this.brand_id,
      status: input.status ?? 'active',
      password_hash: hashedPassword,
    };

    const { data, error } = await this.supabase
      .from('users')
      .insert([insertData])
      .select(`
        user_id,
        brand_id,
        branch_id,
        username,
        email,
        full_name,
        phone,
        role,
        status,
        profile_photo,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('UserService.createCustomer error:', error);
      throw new Error(`Failed to create customer: ${error.message}`);
    }

    return {
      ...data,
    } as User;
  }

  /**
   * Create admin/staff user (ADMIN/STAFF/SUPER_ADMIN)
   * - Requires branch_id
   * - Creates default settings for branch if none exist
   */
  async createAdmin(
    input: Omit<UserCreateInput, 'role' | 'brand_id'> & { role: UserRole.ADMIN | UserRole.STAFF },
    branch_id: string
  ): Promise<User> {
    const hashedPassword = await bcrypt.hash(input.password_hash, SALT_ROUNDS);
    
    const insertData: UserCreateInput = {
      ...input,
      branch_id,
      brand_id: this.brand_id,
      password_hash: hashedPassword,
    };

    const { data, error } = await this.supabase
      .from('users')
      .insert([insertData])
      .select(`
        user_id,
        brand_id,
        branch_id,
        username,
        email,
        full_name,
        phone,
        role,
        status,
        profile_photo,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('UserService.createAdmin error:', error);
      throw new Error(`Failed to create admin: ${error.message}`);
    }

    // ✅ Create default settings for branch if not exists
    await this.ensureBranchSettings(branch_id);

    return {
      ...data,
    } as User;
  }

  /**
   * Ensure settings exist for branch (idempotent)
   */
  private async ensureBranchSettings(branch_id: string): Promise<void> {
    const {  existing, error: checkError } = await this.supabase
      .from('settings')
      .select('settings_id')
      .eq('branch_id', branch_id)
      .eq('brand_id', this.brand_id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (!existing) {
      await this.supabase
        .from('settings')
        .insert({
          brand_id: this.brand_id,
          branch_id,
          // All other fields use DB defaults
        });
    }
  }

  /**
   * Update user (username, email, password, basic info only)
   * Admins can only update non-sensitive fields (no role/brand change)
   */
  async update(
    user_id: string,
    input: Pick<UserUpdateInput, 'username' | 'email' | 'full_name' | 'phone' | 'profile_photo'> & {
      password_hash?: string; // optional rehash
    }
  ): Promise<User> {
    let updateData: any = { ...input };

    // Hash new password if provided
    if (input.password_hash) {
      updateData.password_hash = await bcrypt.hash(input.password_hash, SALT_ROUNDS);
    }

    updateData.updated_at = new Date().toISOString();

    const { data, error } = await this.supabase
      .from('users')
      .update(updateData)
      .eq('user_id', user_id)
      .eq('brand_id', this.brand_id)
      .select(`
        user_id,
        brand_id,
        branch_id,
        username,
        email,
        full_name,
        phone,
        role,
        status,
        profile_photo,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('UserService.update error:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }

    return {
      ...data,
    } as User;
  }

  /**
   * Delete customer user + all associated data
   * - pets → cascade to passport entries, files, appointments
   * - appointments where owner_id = user_id
   * - notifications, audit logs, etc.
   */
  async deleteCustomer(user_id: string): Promise<boolean> {
    const client = this.supabase;

    // 1. Delete pets (cascades to passport entries & files via DB FKs)
    const { error: petError } = await client
      .from('pets')
      .delete()
      .eq('owner_id', user_id)
      .eq('brand_id', this.brand_id);

    if (petError) throw petError;

    // 2. Delete appointments where owner_id = user_id
    const { error: apptError } = await client
      .from('appointments')
      .delete()
      .eq('owner_id', user_id)
      .eq('brand_id', this.brand_id);

    if (apptError) throw apptError;

    // 3. Delete notifications to/from user
    const { error: notifError } = await client
      .from('notifications')
      .delete()
      .or(`user_id.eq.${user_id},sender_id.eq.${user_id}`)
      .eq('brand_id', this.brand_id);

    if (notifError) throw notifError;

    // 4. Delete audit logs (user_id)
    const { error: auditError } = await client
      .from('audit_logs')
      .delete()
      .eq('user_id', user_id)
      .eq('brand_id', this.brand_id);

    if (auditError) throw auditError;

    // 5. Finally, delete user
    const { error: userError } = await client
      .from('users')
      .delete()
      .eq('user_id', user_id)
      .eq('brand_id', this.brand_id);

    if (userError) throw userError;

    return true;
  }

  /**
   * Delete admin/staff user
   * - Delete associated data (appointments created_by, notifications, etc.)
   * - ✅ DO NOT delete branches (they may be managed by others)
   */
  async deleteAdmin(user_id: string): Promise<boolean> {
    const client = this.supabase;

    // 1. Delete appointments created_by this user
    const { error: apptError } = await client
      .from('appointments')
      .delete()
      .eq('created_by', user_id)
      .eq('brand_id', this.brand_id);

    if (apptError) throw apptError;

    // 2. Delete notifications
    const { error: notifError } = await client
      .from('notifications')
      .delete()
      .or(`user_id.eq.${user_id},sender_id.eq.${user_id}`)
      .eq('brand_id', this.brand_id);

    if (notifError) throw notifError;

    // 3. Delete audit logs
    const { error: auditError } = await client
      .from('audit_logs')
      .delete()
      .eq('user_id', user_id)
      .eq('brand_id', this.brand_id);

    if (auditError) throw auditError;

    // 4. Delete user
    const { error: userError } = await client
      .from('users')
      .delete()
      .eq('user_id', user_id)
      .eq('brand_id', this.brand_id);

    if (userError) throw userError;

    return true;
  }
}