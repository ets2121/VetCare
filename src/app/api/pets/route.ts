import { NextRequest } from 'next/server';
import { petController } from '@/controllers/pet.controller';

export async function GET(request: NextRequest) {
  return petController.getAll(request);
}

export async function POST(request: NextRequest) {
  return petController.register(request);
}