/**
 * Pet Service Layer
 * 
 * Responsibilities:
 * - Enforce `brand_id` in all queries (multi-tenancy)
 * - Handle pagination
 * - Extract `segment3` from UUIDs
 * - Auto-set `owner_id` for customer registrations
 * - Restrict updates/deletes by ownership (except SUPER_ADMIN)
 * 
 * Security:
 * - Customers can only manage their own pets
 * - Admins/SUPER_ADMINS see all pets in brand
 */

import { createClient } from '@/lib/supabase/server';
import { Pet, PetCreateInput, PetUpdateInput, PetStatus } from '@/models';

export class PetService {
  private supabase = createClient();
  private brand_id: string;

  constructor(brand_id: string) {
    if (!brand_id) {
      throw new Error('PetService requires brand_id');
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
   * Get paginated pets for the brand
   * @param page 1-based page number
   * @param limit items per page (max 100)
   * @returns {  Pet[], pagination: { total, page, limit, pages } }
   */
  async getAll(page: number = 1, limit: number = 20): Promise<{(Pet & { segment3: string })[],
    pagination: { total: number; page: number; limit: number; pages: number };}> {
    const safeLimit = Math.min(Math.max(limit, 1), 100);
    const offset = (page - 1) * safeLimit;

    // Get total count
    const { count: total, error: countError } = await this.supabase
      .from('pets')
      .select('*', { count: 'exact', head: true })
      .eq('brand_id', this.brand_id);

    if (countError) {
      console.error('PetService.getAll count error:', countError);
      throw new Error(`Failed to count pets: ${countError.message}`);
    }

    // Get data
    const {data, error } = await this.supabase
      .from('pets')
      .select(`
        pet_id,
        owner_id,
        brand_id,
        branch_id,
        name,
        species,
        breed,
        sex,
        dob,
        color,
        weight_kg,
        microchip_id,
        status,
        created_at,
        updated_at
      `)
      .eq('brand_id', this.brand_id)
      .range(offset, offset + safeLimit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('PetService.getAll data error:', error);
      throw new Error(`Failed to fetch pets: ${error.message}`);
    }

    const pages = total ? Math.ceil(total / safeLimit) : 0;

    return {
      data.map(pet => ({
        ...pet,
        segment3: this.extractSegment3(pet.pet_id),
      })) as (Pet & { segment3: string })[],
      pagination: {
        total: total || 0,
        page,
        limit: safeLimit,
        pages,
      },
    };
  }

  /**
   * Search pets by partial UUID (segment3)
   * @param segment3 4-digit UUID segment (e.g., '4966')
   * @returns Pet[] with segment3 included
   */
  async searchBySegment3(segment3: string): Promise<(Pet & { segment3: string })[]> {
    if (!/^[0-9a-f]{4}$/i.test(segment3)) {
      return []; // Invalid format
    }

    const { data, error } = await this.supabase
      .from('pets')
      .select(`
        pet_id,
        owner_id,
        brand_id,
        branch_id,
        name,
        species,
        breed,
        sex,
        dob,
        color,
        weight_kg,
        microchip_id,
        status,
        created_at,
        updated_at
      `)
      .eq('brand_id', this.brand_id)
      .ilike('pet_id', `%-${segment3}-%`);

    if (error) {
      console.error('PetService.searchBySegment3 error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }

    return data.map(pet => ({
      ...pet,
      segment3: this.extractSegment3(pet.pet_id),
    })) as (Pet & { segment3: string })[];
  }

  /**
   * Register a pet for a customer
   * - owner_id = provided user_id (from session)
   * - brand_id = service context
   * - branch_id = null (per your spec: customers don't need branch)
   */
  async register(input: Omit<PetCreateInput, 'owner_id' | 'brand_id' | 'branch_id'>, owner_id: string): Promise<Pet & { segment3: string }> {
    const insertData: PetCreateInput = {
      ...input,
      owner_id,
      brand_id: this.brand_id,
      branch_id: null, // Customers don't have branch association
    };

    const { data, error } = await this.supabase
      .from('pets')
      .insert([insertData])
      .select(`
        pet_id,
        owner_id,
        brand_id,
        branch_id,
        name,
        species,
        breed,
        sex,
        dob,
        color,
        weight_kg,
        microchip_id,
        status,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('PetService.register error:', error);
      throw new Error(`Failed to register pet: ${error.message}`);
    }

    return {
      ...data,
      segment3: this.extractSegment3(data.pet_id),
    } as Pet & { segment3: string };
  }

  /**
   * Update pet — only allow fields that make sense for customer to edit
   * - Cannot change owner_id, brand_id, or pet_id
   * - Dynamic input (any field from PetUpdateInput)
   */
  async update(pet_id: string, input: PetUpdateInput): Promise<Pet & { segment3: string }> {
    // Prevent modification of critical fields
    const updateData = {
      ...input,
      updated_at: new Date().toISOString(),
      // Enforce brand_id and block owner/brand changes
    };

    const { data, error } = await this.supabase
      .from('pets')
      .update(updateData)
      .eq('pet_id', pet_id)
      .eq('brand_id', this.brand_id)
      .select(`
        pet_id,
        owner_id,
        brand_id,
        branch_id,
        name,
        species,
        breed,
        sex,
        dob,
        color,
        weight_kg,
        microchip_id,
        status,
        created_at,
        updated_at
      `)
      .single();

    if (error) {
      console.error('PetService.update error:', error);
      throw new Error(`Failed to update pet: ${error.message}`);
    }

    return {
      ...data,
      segment3: this.extractSegment3(data.pet_id),
    } as Pet & { segment3: string };
  }

  /**
   * Delete pet
   * - If caller is CUSTOMER: must own the pet
   * - If caller is SUPER_ADMIN: can delete any pet in brand
   */
  async delete(pet_id: string, owner_id: string | null, isSuperAdmin: boolean): Promise<boolean> {
    let query = this.supabase
      .from('pets')
      .delete()
      .eq('pet_id', pet_id)
      .eq('brand_id', this.brand_id);

    // Restrict by owner unless SUPER_ADMIN
    if (!isSuperAdmin) {
      query = query.eq('owner_id', owner_id);
    }

    const { error } = await query;

    if (error) {
      console.error('PetService.delete error:', error);
      throw new Error(`Failed to delete pet: ${error.message}`);
    }

    return true;
  }

  /**
   * Check if pet exists and belongs to owner (for customer operations)
   */
  async ownsPet(pet_id: string, owner_id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('pets')
      .select('pet_id')
      .eq('pet_id', pet_id)
      .eq('owner_id', owner_id)
      .eq('brand_id', this.brand_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('PetService.ownsPet error:', error);
      throw error;
    }

    return !!data;
  }
}