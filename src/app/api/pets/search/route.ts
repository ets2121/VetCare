import { NextRequest } from 'next/server';
import { petController } from '@/controllers/pet.controller';

export async function GET(request: NextRequest) {
  return petController.search(request);
}