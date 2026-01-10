import { NextRequest } from 'next/server';
import { petPassportController } from '@/controllers/pet-passport.controller';

export async function POST(request: NextRequest) {
  return petPassportController.create(request);
}