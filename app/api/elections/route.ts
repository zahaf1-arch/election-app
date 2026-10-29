import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const elections = await prisma.election_types.findMany({
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(elections);
  } catch (error) {
    console.error('Erreur API elections:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}