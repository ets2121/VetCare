import { NextRequest } from 'next/server';
import { petPassportController } from '@/controllers/pet-passport.controller';

export async function GET(request: NextRequest) {
  return petPassportController.search(request);
}