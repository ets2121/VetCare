/**
 * Pet Passport Service Layer
 * 
 * Responsibilities:
 * - Enforce `brand_id` in all queries (multi-tenancy)
 * - Handle joins for branch address
 * - Filter passport entries by `visible_to_owner` for customers
 * - Auto-set `staff_id`, `brand_id`, and `branch_id` from session context
 * 
 * Security:
 * - Customers only see their own pets + visible entries
 * - Admins can create/update using their current branch
 */

import { createClient } from '@/lib/supabase/server';
import {
  PetPassportEntry,
  PetPassportEntryCreateInput,
  PetPassportEntryUpdateInput,
  PassportEntryType,
} from '@/models';

// Extended interfaces with joined data
export interface PetWithPassports {
  pet_id: string;
  name: string;
  species: string | null;
  breed: string | null;
  sex: string;
  dob: string | null;
  microchip_id: string | null;
  passport_entries: (PetPassportEntry & {
    branch_address: string | null;
  })[];
}

export interface PetSearchResult {
  pet: {
    pet_id: string;
    name: string;
    microchip_id: string | null;
    owner: {
      user_id: string;
      full_name: string | null;
      email: string;
    };
  };
  passport_entries: (PetPassportEntry & {
    branch_address: string | null;
  })[];
}

export class PetPassportService {
  private supabase = createClient();
  private brand_id: string;

  constructor(brand_id: string) {
    if (!brand_id) {
      throw new Error('PetPassportService requires brand_id');
    }
    this.brand_id = brand_id;
  }

  /**
   * Get all pets for owner + visible passport entries + branch address
   * @param owner_id UUID of owner
   * @returns Promise<PetWithPassports[]>
   */
  async getByOwner(owner_id: string): Promise<PetWithPassports[]> {
    // First get all pets for owner
    const {data: pets, error: petError } = await this.supabase
      .from('pets')
      .select('pet_id, name, species, breed, sex, dob, microchip_id')
      .eq('owner_id', owner_id)
      .eq('brand_id', this.brand_id);

    if (petError) {
      console.error('PetPassportService.getByOwner pets error:', petError);
      throw new Error(`Failed to fetch pets: ${petError.message}`);
    }

    if (pets.length === 0) {
      return [];
    }

    const petIds = pets.map(p => p.pet_id);

    // Get visible passport entries + branch addresses
    const {data:  entries, error: entryError } = await this.supabase
      .from('pet_passport_entries')
      .select(`
        entry_id,
        pet_id,
        brand_id,
        branch_id,
        staff_id,
        entry_type,
        title,
        notes,
        date_of_entry,
        next_due_date,
        visible_to_owner,
        created_at,
        updated_at,
        branch:branches!inner(address)
      `)
      .in('pet_id', petIds)
      .eq('brand_id', this.brand_id)
      .eq('visible_to_owner', true); // Only visible to owner

    if (entryError) {
      console.error('PetPassportService.getByOwner entries error:', entryError);
      throw new Error(`Failed to fetch passport entries: ${entryError.message}`);
    }

    // Map entries to pets
    const petMap = new Map<string, PetWithPassports>();
    pets.forEach(pet => {
      petMap.set(pet.pet_id, {
        ...pet,
        passport_entries: [],
      });
    });

    entries.forEach(entry => {
      const pet = petMap.get(entry.pet_id);
      if (pet) {
        pet.passport_entries.push({
          ...entry,
          branch_address: entry.branch?.address || null,
        });
      }
    });

    return Array.from(petMap.values());
  }

  /**
   * Search pet by microchip ID → pet + owner + all passport entries + branch address
   * @param microchip_id string
   * @returns Promise<PetSearchResult | null>
   */
  async searchByMicrochip(microchip_id: string): Promise<PetSearchResult | null> {
    // Join pets → users (owner) → passport entries → branches
    const { data, error } = await this.supabase
      .from('pets')
      .select(`
        pet_id,
        name,
        microchip_id,
        owner:users!owner_id(
          user_id,
          full_name,
          email
        ),
        passport_entries:pet_passport_entries(
          entry_id,
          pet_id,
          brand_id,
          branch_id,
          staff_id,
          entry_type,
          title,
          notes,
          date_of_entry,
          next_due_date,
          visible_to_owner,
          created_at,
          updated_at,
          branch:branches!inner(address)
        )
      `)
      .eq('microchip_id', microchip_id)
      .eq('brand_id', this.brand_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('PetPassportService.searchByMicrochip error:', error);
      throw new Error(`Search failed: ${error.message}`);
    }

    if (!data) return null;

    return {
      pet: {
        pet_id: data.pet_id,
        name: data.name,
        microchip_id: data.microchip_id,
        owner: {
          user_id: data.owner.user_id,
          full_name: data.owner.full_name,
          email: data.owner.email,
        },
      },
      passport_entries: data.passport_entries.map(entry => ({
        ...entry,
        branch_address: entry.branch?.address || null,
      })),
    };
  }

  /**
   * Create new passport entry
   * - staff_id = provided user_id (from session)
   * - brand_id = service context
   * - branch_id = provided (from admin's current branch)
   */
  async create(
    input: Omit<PetPassportEntryCreateInput, 'staff_id' | 'brand_id' >,
    staff_id: string,
    branch_id: string
  ): Promise<PetPassportEntry & { branch_address: string | null }> {
    const insertData: PetPassportEntryCreateInput = {
      ...input,
      staff_id,
      brand_id: this.brand_id,
      branch_id,
    };

    const { data, error } = await this.supabase
      .from('pet_passport_entries')
      .insert([insertData])
      .select(`
        entry_id,
        pet_id,
        brand_id,
        branch_id,
        staff_id,
        entry_type,
        title,
        notes,
        date_of_entry,
        next_due_date,
        visible_to_owner,
        created_at,
        updated_at,
        branch:branches!inner(address)
      `)
      .single();

    if (error) {
      console.error('PetPassportService.create error:', error);
      throw new Error(`Failed to create passport entry: ${error.message}`);
    }

    return {
      ...data,
      branch_address: data.branch?.address || null,
    };
  }

  /**
   * Update passport entry
   * - Auto-update branch_id to current admin's branch
   * - Dynamic input (any field from PetPassportEntryUpdateInput)
   */
  async update(
    entry_id: string,
    input: PetPassportEntryUpdateInput,
    newBranchId: string
  ): Promise<PetPassportEntry & { branch_address: string | null }> {
    const updateData = {
      ...input,
      branch_id: newBranchId, // Override to current admin's branch
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await this.supabase
      .from('pet_passport_entries')
      .update(updateData)
      .eq('entry_id', entry_id)
      .eq('brand_id', this.brand_id)
      .select(`
        entry_id,
        pet_id,
        brand_id,
        branch_id,
        staff_id,
        entry_type,
        title,
        notes,
        date_of_entry,
        next_due_date,
        visible_to_owner,
        created_at,
        updated_at,
        branch:branches!inner(address)
      `)
      .single();

    if (error) {
      console.error('PetPassportService.update error:', error);
      throw new Error(`Failed to update passport entry: ${error.message}`);
    }

    return {
      ...data,
      branch_address: data.branch?.address || null,
    };
  }

  /**
   * Delete passport entry
   */
  async delete(entry_id: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('pet_passport_entries')
      .delete()
      .eq('entry_id', entry_id)
      .eq('brand_id', this.brand_id);

    if (error) {
      console.error('PetPassportService.delete error:', error);
      throw new Error(`Failed to delete passport entry: ${error.message}`);
    }

    return true;
  }

  /**
   * Verify passport entry exists and belongs to brand
   */
  async entryExists(entry_id: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('pet_passport_entries')
      .select('entry_id')
      .eq('entry_id', entry_id)
      .eq('brand_id', this.brand_id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  }
}