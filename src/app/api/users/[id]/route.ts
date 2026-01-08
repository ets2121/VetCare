import { NextRequest } from 'next/server';
import { userController } from '@/controllers/user.controller';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  return userController.getById(request, { params });
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  return userController.update(request, { params });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return userController.delete(request, { params });
}