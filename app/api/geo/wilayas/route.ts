import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const wilayas = await prisma.wilayas.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(wilayas);
  } catch (error) {
    console.error('Erreur API wilayas:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des wilayas' }, { status: 500 });
  }
}