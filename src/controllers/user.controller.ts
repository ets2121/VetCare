/**
 * User Controller Layer
 * 
 * Role Rules:
 * - GET /users → ADMIN, SUPER_ADMIN
 * - GET /users/:id → public (within brand)
 * - GET /users/search → ADMIN, SUPER_ADMIN
 * - POST /users/customer → ADMIN, SUPER_ADMIN
 * - POST /users/admin → SUPER_ADMIN only
 * - PUT /users/:id → SUPER_ADMIN only
 * - DELETE /users/:id?type=customer → SUPER_ADMIN
 * - DELETE /users/:id?type=admin → SUPER_ADMIN
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/session';
import { UserRole, UserUpdateSchema } from '@/models';
import { UserService } from '@/services/user.service';

// Validation schemas (split for customer vs admin)
const CustomerCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(72), // bcrypt limit
  full_name: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
});

const AdminCreateSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  full_name: z.string().max(100).optional().nullable(),
  phone: z.string().max(20).optional().nullable(),
  role: z.enum([UserRole.ADMIN, UserRole.STAFF]),
  branch_id: z.string().uuid(),
});

// const UserUpdateSchema = z.object({
//   username: z.string().min(3).max(50).optional(),
//   email: z.string().email().optional(),
//   password_hash: z.string().min(8).max(72).optional(), // optional rehash
//   full_name: z.string().max(100).optional().nullable(),
//   phone: z.string().max(20).optional().nullable(),
//   profile_photo: z.string().url().optional().nullable(),
// });

function hasRole(requiredRoles: UserRole[], actualRole?: string): boolean {
  if (!actualRole) return false;
  return requiredRoles.includes(actualRole as UserRole);
}

export const userController = {
  // GET /api/users
  async getAll(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN], session.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const service = new UserService(session.brand_id);
      const users = await service.getAll();
      return NextResponse.json(users, { status: 200 });
    } catch (error) {
      console.error('GET /users error:', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  },

  // GET /api/users/:id
  async getById(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      const service = new UserService(session.brand_id);
      const user = await service.getById(params.id);

      if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }

      return NextResponse.json(user, { status: 200 });
    } catch (error) {
      console.error('GET /users/:id error:', error);
      return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
  },

  // GET /api/users/search?query=4966
  async search(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN], session.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const query = searchParams.get('query')?.trim();
      if (!query) {
        return NextResponse.json({ error: 'Missing query param' }, { status: 400 });
      }

      const service = new UserService(session.brand_id);
      const results = await service.search(query);
      return NextResponse.json(results, { status: 200 });
    } catch (error) {
      console.error('GET /users/search error:', error);
      return NextResponse.json({ error: 'Search failed' }, { status: 500 });
    }
  },

  // POST /api/users/customer
  async createCustomer(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasRole([UserRole.ADMIN, UserRole.CUSTOMER], session.role)) {
        return NextResponse.json({ error: 'Only admins can create customers' }, { status: 403 });
      }

      const body = await req.json();
      const validated = CustomerCreateSchema.parse(body);

      const service = new UserService(session.brand_id);
      const user = await service.createCustomer({
        username: validated.username,
        email: validated.email,
        password_hash: validated.password, // will be hashed in service
        full_name: validated.full_name,
        phone: validated.phone,
      });

      return NextResponse.json(user, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      console.error('POST /users/customer error:', error);
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 });
    }
  },

  // POST /api/users/admin
  async createAdmin(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (session.role !== UserRole.SUPER_ADMIN) {
        return NextResponse.json({ error: 'Only SUPER_ADMIN can create admins' }, { status: 403 });
      }

      const body = await req.json();
      const validated = AdminCreateSchema.parse(body);

      const service = new UserService(session.brand_id);
      const user = await service.createAdmin(
        {
          username: validated.username,
          email: validated.email,
          password_hash: validated.password,
          full_name: validated.full_name,
          phone: validated.phone,
          role: validated.role,
        },
        validated.branch_id
      );

      return NextResponse.json(user, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      console.error('POST /users/admin error:', error);
      return NextResponse.json({ error: 'Failed to create admin' }, { status: 500 });
    }
  },

  // PUT /api/users/:id
  async update(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (!hasRole([UserRole.CUSTOMER, UserRole.SUPER_ADMIN], session.role)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }

      const body = await req.json();
      const validated = UserUpdateSchema.parse(body);

      const service = new UserService(session.brand_id);
      const user = await service.update(params.id, {
        username: validated.username,
        email: validated.email,
        password_hash: validated.password, // optional
        full_name: validated.full_name,
        phone: validated.phone,
        profile_photo: validated.profile_photo,
      });

      return NextResponse.json(user, { status: 200 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      console.error('PUT /users/:id error:', error);
      return NextResponse.json({ error: 'Failed to update user tt', msg: error }, { status: 500 });
    }
  },

  // DELETE /api/users/:id?type=customer|admin
  async delete(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      if (session.role !== UserRole.SUPER_ADMIN) {
        return NextResponse.json({ error: 'Only SUPER_ADMIN can delete users' }, { status: 403 });
      }

      const { searchParams } = new URL(req.url);
      const type = searchParams.get('type');

      if (type !== 'customer' && type !== 'admin') {
        return NextResponse.json({ error: 'Missing or invalid type (customer|admin)' }, { status: 400 });
      }

      const service = new UserService(session.brand_id);

      if (type === 'customer') {
        await service.deleteCustomer(params.id);
      } else {
        await service.deleteAdmin(params.id);
      }

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error(`DELETE /users/${params.id} error:`, error);
      return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
    }
  }
};