import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Récupérer la liste des candidatures avec filtrage optionnel par zone et élection
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const electionTypeId = searchParams.get('electionTypeId');
    const communeId = searchParams.get('communeId');
    const moughataaId = searchParams.get('moughataaId');
    const wilayaId = searchParams.get('wilayaId');
    const estNationale = searchParams.get('estNationale');

    // Construction dynamique de la clause WHERE
    const whereCondition: any = {};

    if (electionTypeId) {
      whereCondition.electionTypeId = parseInt(electionTypeId, 10);
    }

    if (communeId) {
      whereCondition.communeId = parseInt(communeId, 10);
    }

    if (moughataaId) {
      whereCondition.moughataaId = parseInt(moughataaId, 10);
    }

    if (wilayaId) {
      whereCondition.wilayaId = parseInt(wilayaId, 10);
    }

    if (estNationale !== null && estNationale !== undefined) {
      whereCondition.estNationale = estNationale === 'true';
    }

    const candidatures = await prisma.candidatures.findMany({
      where: whereCondition,
      include: {
        partis: true,
        election_types: true,
        wilayas: true,
        moughataas: true,
        communes: true,
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(candidatures);
  } catch (error) {
    console.error('Erreur GET candidatures:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Ajouter une nouvelle candidature
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { partiId, electionTypeId, scope, wilayaId, moughataaId, communeId } = body;

    if (!partiId || !electionTypeId || !scope) {
      return NextResponse.json({ error: 'Parti, Élection et Portée sont requis' }, { status: 400 });
    }

    const newCandidature = await prisma.candidatures.create({
      data: {
        partiId: parseInt(partiId, 10),
        electionTypeId: parseInt(electionTypeId, 10),
        estNationale: scope === 'national',
        wilayaId: wilayaId ? parseInt(wilayaId, 10) : null,
        moughataaId: moughataaId ? parseInt(moughataaId, 10) : null,
        communeId: communeId ? parseInt(communeId, 10) : null,
      },
    });

    return NextResponse.json(newCandidature);
  } catch (error) {
    console.error('Erreur POST candidature:', error);
    return NextResponse.json({ error: 'Erreur lors de la création de la candidature' }, { status: 500 });
  }
}

// Supprimer une candidature
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await prisma.candidatures.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE candidature:', error);
    return NextResponse.json({ error: 'Erreur de suppression' }, { status: 500 });
  }
}