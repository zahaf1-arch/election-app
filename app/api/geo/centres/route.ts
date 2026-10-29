import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const wilayaId = searchParams.get('wilayaId');
    const moughataaId = searchParams.get('moughataaId');
    const communeId = searchParams.get('communeId');

    // 🟢 Ajouter le type explicite any[] ici
    let centres: any[] = [];

    if (communeId) {
      centres = await prisma.centres.findMany({
        where: { communeId: parseInt(communeId, 10) },
        orderBy: { nom_fr: 'asc' },
      });
    } else if (moughataaId) {
      centres = await prisma.centres.findMany({
        where: { communes: { moughataaId: parseInt(moughataaId, 10) } },
        orderBy: { nom_fr: 'asc' },
      });
    } else if (wilayaId) {
      // Pour Nouakchott ou wilaya globale
      centres = await prisma.centres.findMany({
        where: { communes: { moughataas: { wilayaId: parseInt(wilayaId, 10) } } },
        orderBy: { nom_fr: 'asc' },
      });
    }

    // 🟢 Renvoie toujours un tableau (même vide [])
    return NextResponse.json(centres);
  } catch (error) {
    console.error('Erreur API centres:', error);
    // 🟢 En cas d'erreur serveur, renvoyer un tableau vide au lieu d'un objet d'erreur brut
    return NextResponse.json([], { status: 500 });
  }
}