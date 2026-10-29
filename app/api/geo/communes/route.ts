import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const moughataaId = searchParams.get('moughataaId');

    if (!moughataaId) {
      return NextResponse.json({ error: 'Paramètre moughataaId requis' }, { status: 400 });
    }

    const communes = await prisma.communes.findMany({
      where: { moughataaId: parseInt(moughataaId, 10) },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(communes);
  } catch (error) {
    console.error('Erreur API communes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}