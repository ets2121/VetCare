/**
 * Pet Controller Layer
 * 
 * Role Rules:
 * - GET /pets → SUPER_ADMIN, ADMIN
 * - GET /pets/search → ADMIN only
 * - POST /pets → CUSTOMER only
 * - PUT /pets/:id → CUSTOMER only
 * - DELETE /pets/:id → CUSTOMER, SUPER_ADMIN
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { PetCreateSchema } from '@/models';
import { PetService } from '@/services/pet.service';
import { UserRole } from '@/models';

// Validation schema for pet registration
const PetRegisterSchema = z.object({
  name: z.string().min(1).max(100),
  species: z.string().max(50).optional().nullable(),
  breed: z.string().max(100).optional().nullable(),
  sex: z.enum(['male', 'female', 'unknown']),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(), // YYYY-MM-DD
  color: z.string().max(50).optional().nullable(),
  weight_kg: z.number().nonnegative().optional().nullable(),
  microchip_id: z.string().max(50).optional().nullable(),
  status: z.enum(['active', 'inactive', 'deceased']).default('active'),
});

function hasRole(requiredRoles: UserRole[], actualRole?: string): boolean {
  if (!actualRole) return false;
  return requiredRoles.includes(actualRole as UserRole);
}

export const petController = {
  // GET /api/pets?page=1&limit=20
  async getAll(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasRole([UserRole.SUPER_ADMIN, UserRole.ADMIN], session.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const page = parseInt(searchParams.get('page') || '1', 10);
      const limit = parseInt(searchParams.get('limit') || '20', 10);

      const service = new PetService(session.brand_id);
      const result = await service.getAll(page, limit);

      return NextResponse.json(result, { status: 200 });
    } catch (error) {
      console.error('GET /pets error:', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  },

  // GET /api/pets/search?query=4966
  async search(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (session.role !== UserRole.ADMIN) {
        return NextResponse.json({ error: 'Only ADMIN can search pets' }, { status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const query = searchParams.get('query')?.trim();
      if (!query || !/^[0-9a-f]{4}$/i.test(query)) {
        return NextResponse.json({ error: 'Invalid query (must be 4-digit hex)' }, { status: 400 });
      }

      const service = new PetService(session.brand_id);
      const pets = await service.searchBySegment3(query);
      return NextResponse.json(pets, { status: 200 });
    } catch (error) {
      console.error('GET /pets/search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
  },

  // POST /api/pets
  async register(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (session.role !== UserRole.CUSTOMER) {
        return NextResponse.json({ error: 'Only customers can register pets' }, { status: 403 });
      }

      const body = await req.json();
      const validated = PetRegisterSchema.parse(body);

      const service = new PetService(session.brand_id);
      const pet = await service.register(validated, session.user_id!);

      return NextResponse.json(pet, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      console.error('POST /pets error:', error);
      return NextResponse.json({ error: 'Failed to register pet' }, { status: 500 });
    }
  },

  // PUT /api/pets/:id
  async update(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (session.role !== UserRole.CUSTOMER) {
        return NextResponse.json({ error: 'Only customers can update pets' }, { status: 403 });
      }

      // Verify ownership
      const service = new PetService(session.brand_id);
      const owns = await service.ownsPet(params.id, session.user_id!);
      if (!owns) {
        return NextResponse.json({ error: 'Pet not found or access denied' }, { status: 404 });
      }

      const body = await req.json();
      // Use Zod partial schema for dynamic updates
      const validated = PetCreateSchema.partial().parse(body);

      const updatedPet = await service.update(params.id, validated);
      return NextResponse.json(updatedPet, { status: 200 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      console.error('PUT /pets/:id error:', error);
      return NextResponse.json({ error: 'Failed to update pet' }, { status: 500 });
    }
  },

  // DELETE /api/pets/:id
  async delete(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (session.role !== UserRole.CUSTOMER && session.role !== UserRole.SUPER_ADMIN) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const isSuperAdmin = session.role === UserRole.SUPER_ADMIN;
      const service = new PetService(session.brand_id);

      await service.delete(params.id, session.user_id!, isSuperAdmin);

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('DELETE /pets/:id error:', error);
      return NextResponse.json({ error: 'Failed to delete pet' }, { status: 500 });
    }
  }
};