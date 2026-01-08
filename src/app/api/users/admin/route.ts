import { NextRequest } from 'next/server';
import { userController } from '@/controllers/user.controller';

export async function POST(request: NextRequest) {
  return userController.createAdmin(request);
}