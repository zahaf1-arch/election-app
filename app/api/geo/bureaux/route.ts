import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const centreId = searchParams.get('centreId');

    if (!centreId) {
      return NextResponse.json({ error: 'Paramètre centreId requis' }, { status: 400 });
    }

    const bureaux = await prisma.bureaux.findMany({
      where: { centreId: parseInt(centreId, 10) },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(bureaux);
  } catch (error) {
    console.error('Erreur API bureaux:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}