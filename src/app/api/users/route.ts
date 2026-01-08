import { NextRequest } from 'next/server';
import { userController } from '@/controllers/user.controller';

export async function GET(request: NextRequest) {
  return userController.getAll(request);
}
// POST handled in /customer and /admin