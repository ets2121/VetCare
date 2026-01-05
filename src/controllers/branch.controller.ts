/**
 * Branch Controller Layer
 * 
 * Responsibilities:
 * - HTTP request/response handling
 * - Session extraction & role validation
 * - Input validation (Zod)
 * - Error formatting (consistent JSON responses)
 * 
 * Role Rules (as per spec):
 * - GET /api/branches → all roles (even unauth? but session required for brand)
 * - GET /api/branches/:id → ADMIN, SUPER_ADMIN
 * - POST /api/branches → SUPER_ADMIN only
 * - PUT /api/branches/:id → ADMIN, SUPER_ADMIN
 * - DELETE /api/branches/:id → SUPER_ADMIN only
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { BranchCreateSchema, BranchUpdateSchema } from '@/models';
import { BranchService } from '@/services/branch.service';
import { UserRole } from '@/models';

// Helper: Check if role is allowed
function hasRole(requiredRoles: UserRole[], actualRole?: string): boolean {
  if (!actualRole) return false;
  return requiredRoles.includes(actualRole as UserRole);
}

export const branchController = {
  /**
   * GET /api/branches
   * ✅ No role restriction — but requires valid session with brand_id
   */
  async getAll(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();
      
      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json(
          { error: 'Unauthorized: Brand context required' },
          { status: 401 }
        );
      }

      const service = new BranchService(session.brand_id);
      const branches = await service.getAll();

      return NextResponse.json(branches, { status: 200 });
    } catch (error) {
      console.error('GET /branches error:', error);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  },

  /**
   * GET /api/branches/:id
   * 🔐 Requires: ADMIN or SUPER_ADMIN
   */
  async getById(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      const { id: branch_id } = params;

      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN], session.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
      }

      const service = new BranchService(session.brand_id);
      const branch = await service.getById(branch_id);

      if (!branch) {
        return NextResponse.json({ error: 'Branch not found' }, { status: 404 });
      }

      return NextResponse.json(branch, { status: 200 });
    } catch (error) {
      console.error('GET /branches/:id error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  },

  /**
   * POST /api/branches
   * 🔐 Requires: SUPER_ADMIN only
   */
  async create(req: NextRequest): Promise<NextResponse> {
    try {
      const session = await getSession();

      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (session.role !== UserRole.SUPER_ADMIN) {
        return NextResponse.json({ error: 'Forbidden: Only SUPER_ADMIN can create branches' }, { status: 403 });
      }

      const body = await req.json();
      const validated = BranchCreateSchema.parse(body); // Zod validation

      const service = new BranchService(session.brand_id);
      const newBranch = await service.create(validated);

      return NextResponse.json(newBranch, { status: 201 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      console.error('POST /branches error:', error);
      return NextResponse.json({ error: 'Failed to create branch' }, { status: 500 });
    }
  },

  /**
   * PUT /api/branches/:id
   * 🔐 Requires: ADMIN or SUPER_ADMIN
   */
  async update(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      const { id: branch_id } = params;

      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (!hasRole([UserRole.ADMIN, UserRole.SUPER_ADMIN], session.role)) {
        return NextResponse.json({ error: 'Forbidden: Insufficient permissions' }, { status: 403 });
      }

      const body = await req.json();
      const validated = BranchUpdateSchema.parse(body);

      const service = new BranchService(session.brand_id);
      const updatedBranch = await service.update(branch_id, validated);

      return NextResponse.json(updatedBranch, { status: 200 });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        return NextResponse.json({ error: 'Validation failed', details: error.errors }, { status: 400 });
      }
      console.error('PUT /branches/:id error:', error);
      return NextResponse.json({ error: 'Failed to update branch' }, { status: 500 });
    }
  },

  /**
   * DELETE /api/branches/:id
   * 🔐 Requires: SUPER_ADMIN only
   */
  async delete(req: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
    try {
      const session = await getSession();
      const { id: branch_id } = params;

      if (!session.isLoggedIn || !session.brand_id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      if (session.role !== UserRole.SUPER_ADMIN) {
        return NextResponse.json({ error: 'Forbidden: Only SUPER_ADMIN can delete branches' }, { status: 403 });
      }

      const service = new BranchService(session.brand_id);
      await service.delete(branch_id);

      return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
      console.error('DELETE /branches/:id error:', error);
      return NextResponse.json({ error: 'Failed to delete branch' }, { status: 500 });
    }
  }
};