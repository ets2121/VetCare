/**
 * API Route: /api/branches
 * 
 * Supported Methods:
 * - GET → list all branches (brand-scoped)
 * - POST → create branch (SUPER_ADMIN only)
 */

import { NextRequest } from 'next/server';
import { branchController } from '@/controllers/branch.controller';

export async function GET(request: NextRequest) {
  return branchController.getAll(request);
}

export async function POST(request: NextRequest) {
  return branchController.create(request);
}