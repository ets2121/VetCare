/**
 * API Route: /api/branches/{id}
 * 
 * Supported Methods:
 * - GET → get branch by ID (ADMIN+)
 * - PUT → update branch (ADMIN+)
 * - DELETE → delete branch (SUPER_ADMIN only)
 */

import { NextRequest } from 'next/server';
import { branchController } from '@/controllers/branch.controller';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return branchController.getById(request, { params });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return branchController.update(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return branchController.delete(request, { params });
}