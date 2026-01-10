import { NextRequest } from 'next/server';
import { petPassportController } from '@/controllers/pet-passport.controller';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return petPassportController.update(request, { params });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  return petPassportController.delete(request, { params });
}