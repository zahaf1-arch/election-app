import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const types = await prisma.election_types.findMany({
      where: { actif: true },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(types);
  } catch (error) {
    console.error('Erreur API election-types:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}