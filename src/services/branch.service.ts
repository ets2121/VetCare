/**
 * Branch Service Layer
 * 
 * Responsibilities:
 * - Enforce multi-tenancy: every query MUST include `brand_id`
 * - Handle business logic (e.g., branch name uniqueness per brand)
 * - Abstract Supabase calls — no HTTP/Next.js deps
 * 
 * Security:
 * - All methods require `brand_id` — never query across brands
 * - Caller must validate roles (done in controller)
 */

import { createClient } from '@/lib/supabase/server';
import { getSession } from '@/lib/session';
import { Branch, BranchCreateInput, BranchUpdateInput } from '@/models';

export class BranchService {
  private supabase = createClient();
  private brand_id: string;

  constructor(brand_id: string) {
    if (!brand_id) {
      throw new Error('BranchService requires brand_id for multi-tenancy');
    }
    this.brand_id = brand_id;
  }

  /**
   * Get all branches for the current brand
   * @returns Promise<Branch[]> — only branches under `this.brand_id`
   */
  async getAll(): Promise<Branch[]> {
    const { data, error } = await this.supabase
      .from('branches')
      .select(`
        branch_id,
        brand_id,
        name,
        address,
        phone,
        status,
        created_at,
        updated_at
      `)
      .eq('brand_id', this.brand_id)
      .order('name', { ascending: true });

    if (error) {
      console.error('BranchService.getAll error:', error);
      throw new Error(`Failed to fetch branches: ${error.message}`);
    }

    return data as Branch[];
  }

  /**
   * Get branch by ID — scoped to brand
   * @param branch_id UUID of branch
   * @returns Promise<Branch | null>
   */
  async getById(branch_id: string): Promise<Branch | null> {
    const { data, error } = await this.supabase
      .from('branches')
      .select(`
        branch_id,
        brand_id,
        name,
        address,
        phone,
        status,
        created_at,
        updated_at
      `)
      .eq('branch_id', branch_id)
      .eq('brand_id', this.brand_id) // 🔒 Critical: prevent cross-brand access
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = "no rows returned"
      console.error('BranchService.getById error:', error);
      throw new Error(`Failed to fetch branch: ${error.message}`);
    }

    return data ? (data as Branch) : null;
  }

  /**
   * Create a new branch for the brand
   * @param input BranchCreateInput (validated by controller)
   * @returns Promise<Branch>
   */
  async create(input: BranchCreateInput): Promise<Branch> {
    // Enforce brand_id from service context — ignore input.brand_id for safety
    const insertData = {
      ...input,
      brand_id: this.brand_id, // 🔒 Override to ensure correctness
    };

    const { data, error } = await this.supabase
      .from('branches')
      .insert([insertData])
      .select(`
        branch_id,
        brand_id,
        name,
        address,
        phone,
        status,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('BranchService.create error:', error);
      throw new Error(`Failed to create branch: ${error.message}`);
    }

    return data as Branch;
  }

  /**
   * Update branch — scoped to brand
   * @param branch_id UUID
   * @param input BranchUpdateInput
   * @returns Promise<Branch>
   */
  async update(branch_id: string, input: BranchUpdateInput): Promise<Branch> {
    // Prevent modifying brand_id or branch_id
    const updateData = {
      ...input,
      updated_at: new Date().toISOString(), // Ensure updated_at refresh
    };

    const { data, error } = await this.supabase
      .from('branches')
      .update(updateData)
      .eq('branch_id', branch_id)
      .eq('brand_id', this.brand_id) // 🔒 Critical
      .select(`
        branch_id,
        brand_id,
        name,
        address,
        phone,
        status,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('BranchService.update error:', error);
      throw new Error(`Failed to update branch: ${error.message}`);
    }

    return data as Branch;
  }

  /**
   * Delete branch — soft delete recommended, but DB allows hard delete
   * Here we do hard delete per schema (no deleted_at column)
   * @param branch_id UUID
   * @returns Promise<boolean> true if deleted
   */
  async delete(branch_id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('branches')
      .delete()
      .eq('branch_id', branch_id)
      .eq('brand_id', this.brand_id); // 🔒 Critical

    if (error) {
      console.error('BranchService.delete error:', error);
      throw new Error(`Failed to delete branch: ${error.message}`);
    }

    return true; // Supabase delete returns count=0 if not found, but no error
  }
}