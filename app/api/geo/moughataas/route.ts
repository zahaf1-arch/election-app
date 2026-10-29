import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wilayaIdParam = searchParams.get('wilayaId');

    if (!wilayaIdParam) {
      return NextResponse.json({ error: 'Paramètre wilayaId requis' }, { status: 400 });
    }

    const wilayaId = parseInt(wilayaIdParam, 10);

    const moughataas = await prisma.moughataas.findMany({
      where: { wilayaId },
      orderBy: { id: 'asc' },
    });

    return NextResponse.json(moughataas);
  } catch (error) {
    console.error('Erreur API moughataas:', error);
    return NextResponse.json({ error: 'Erreur lors de la récupération des moughataas' }, { status: 500 });
  }
}