import { NextRequest } from 'next/server';
import { petController } from '@/controllers/pet.controller';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return petController.update(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return petController.delete(request, { params });
}