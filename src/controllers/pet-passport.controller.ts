/**
 * Pet Passport Controller Layer
 * 
 * Role Rules:
 * - GET /by-owner → CUSTOMER only
 * - GET /search → ADMIN only
 * - POST → ADMIN, SUPER_ADMIN
 * - PUT /:id → ADMIN only
 * - DELETE /:id → ADMIN only
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { UserRole } from '@/models';
import { PetPassportService } from '@/services/pet-passport.service';

// Validation schema for new passport entry
const PassportEntryCreateSchema = z.object({
  pet_id: z.string().uuid(),
  entry_type: z.enum(['VACCINE', 'CHECKUP', 'SURGERY', 'MEDICATION', 'OTHER']),
  title: z.string().max(255).optional().nullable(),
  notes: z.string().max(5000).optional().nullable(),
  date_of_entry: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  next_due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  visible_to_owner: z.boolean().default(true),
});

function hasRole(requiredRoles: UserRole[], actualRole?: string): boolean {
  if (!actualRole) return false;
  return requiredRoles.includes(actualRole as UserRole);
}

export const petPassportController = {
  // GET /api/pet-passports/by-owner
  async getByOwner(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (session.role !== UserRole.CUSTOMER) {
        return NextResponse.json({ error: 'Only customers can view their pets passports' }, { status: 403 });
      }

      const service = new PetPassportService(session.brand_id);
      const result = await service.getByOwner(session.user_id!);

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('GET /pet-passports/by-owner error:', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  },

  // GET /api/pet-passports/search?microchip=985123456789012
  async search(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (session.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: 'Only admins can search by microchip' }, { status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const microchip = searchParams.get('microchip')?.trim();
      if (!microchip) {
        return NextResponse.json({ error: 'Missing microchip parameter' }, { status: 400 });
      }

      const service = new PetPassportService(session.brand_id);
      const result = await service.searchByMicrochip(microchip);

      if (!result) {
        return NextResponse.json({ error: 'Pet not found' }, { status: 404 });
      }

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('GET /pet-passports/search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
  },

  // POST /api/pet-passports
  async create(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN], session.role)) {
        return NextResponse.json({ error: 'Only admins can create passport entries' }, { status: 403 });
      }
      if (!session.branch_id) {
        return NextResponse.json({ error: 'Admin must be assigned to a branch' }, { status: 400 });
      }

      const body = await req.json();
      const validated = PassportEntryCreateSchema.parse(body);

      const service = new PetPassportService(session.brand_id);
      const entry = await service.create(
        validated,
        session.user_id!, // staff_id
        session.branch_id  // current admin's branch
      );

      return NextResponse.json(entry, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      console.error('POST /pet-passports error:', error);
      return NextResponse.json({ error: 'Failed to create entry' }, { status: 500 });
    }
  },

  // PUT /api/pet-passports/:id
  async update(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (session.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: 'Only admins can update passport entries' }, { status: 403 });
      }
      if (!session.branch_id) {
        return NextResponse.json({ error: 'Admin must be assigned to a branch' }, { status: 400 });
      }

      const service = new PetPassportService(session.brand_id);
      const exists = await service.entryExists(params.id);
      if (!exists) {
        return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
      }

      const body = await req.json();
      const validated = PassportEntryCreateSchema.partial().parse(body);

      const updatedEntry = await service.update(
        params.id,
        validated,
        session.branch_id // auto-update to current branch
      );

      return NextResponse.json(updatedEntry, { status: 200 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      console.error('PUT /pet-passports/:id error:', error);
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 });
    }
  },

  // DELETE /api/pet-passports/:id
  async delete(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (session.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: 'Only admins can delete passport entries' }, { status: 403 });
      }

      const service = new PetPassportService(session.brand_id);
      await service.delete(params.id);

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('DELETE /pet-passports/:id error:', error);
      return NextResponse.json({ error: 'Failed to delete entry' }, { status: 500 });
    }
  }
};