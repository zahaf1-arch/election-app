import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// 1. Consulter les saisies d'un bureau de vote
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const bureauIdStr = searchParams.get('bureauId');

    if (!bureauIdStr) {
      return NextResponse.json({ error: 'Bureau ID requis' }, { status: 400 });
    }

    const bureauId = parseInt(bureauIdStr, 10);

    const saisies = await prisma.resultats.findMany({
      where: { bureauId },
      include: {
        partis: true,
        election_types: true,
      },
    });

    return NextResponse.json(saisies);
  } catch (error) {
    console.error('Erreur GET /api/saisie:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// 2. Enregistrer ou mettre à jour les résultats (POST)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bureauId, electionTypeId, votants, voixNuls, voixRejetes, pvImage, voixPartis } = body;

    if (!bureauId || !electionTypeId) {
      return NextResponse.json({ error: 'Paramètres obligatoires manquants (bureauId, electionTypeId).' }, { status: 400 });
    }

    const parsedBureauId = parseInt(bureauId, 10);
    const parsedElectionTypeId = parseInt(electionTypeId, 10);
    const parsedVotants = votants !== undefined ? parseInt(votants, 10) : null;
    const parsedVoixNuls = voixNuls !== undefined ? parseInt(voixNuls, 10) : 0;
    const parsedVoixRejetes = voixRejetes !== undefined ? parseInt(voixRejetes, 10) : 0;
    const parsedPvImage = pvImage || null;

    // Utilisation d'une transaction pour garantir la cohérence
    await prisma.$transaction(async (tx) => {
      // Mettre à jour le nombre de votants sur le bureau de vote
      if (parsedVotants !== null) {
        await tx.bureaux.update({
          where: { id: parsedBureauId },
          data: { nombreVotants: parsedVotants },
        });
      }

      // Supprimer les anciens résultats pour ce bureau et ce type d'élection (permet la resaisie propre)
      await tx.resultats.deleteMany({
        where: {
          bureauId: parsedBureauId,
          electionTypeId: parsedElectionTypeId,
        },
      });

      // Insérer les nouveaux résultats actualisés pour chaque parti
      if (voixPartis && Array.isArray(voixPartis) && voixPartis.length > 0) {
        const dataToInsert = voixPartis.map((item: any) => ({
          electionTypeId: parsedElectionTypeId,
          bureauId: parsedBureauId,
          partiId: parseInt(item.partiId, 10),
          nombreVoix: parseInt(item.nombreVoix, 10) || 0,
          voixNuls: parsedVoixNuls,
          voixRejetes: parsedVoixRejetes,
          pvImage: parsedPvImage,
        }));

        await tx.resultats.createMany({
          data: dataToInsert,
        });
      }
    });

    return NextResponse.json({ success: true, message: 'Résultats enregistrés avec succès.' }, { status: 201 });
  } catch (error: any) {
    console.error('Erreur POST /api/saisie:', error);
    return NextResponse.json(
      { error: error.message || 'Erreur lors de l’enregistrement des résultats.' }, 
      { status: 500 }
    );
  }
}