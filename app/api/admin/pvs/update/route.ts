import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bureauId, electionTypeId, votants, nuls, rejets, voixDetails } = body;

    if (!bureauId || !electionTypeId) {
      return NextResponse.json(
        { error: 'Champs bureauId et electionTypeId requis' },
        { status: 400 }
      );
    }

    // 1. Mettre à jour le nombre de votants dans la table 'bureaux'
    if (typeof votants === 'number') {
      await prisma.bureaux.update({
        where: { id: bureauId },
        data: {
          nombreVotants: votants,
        },
      });
    }

    // 2. Mettre à jour les voix, nuls et rejets dans la table 'resultats'
    if (voixDetails && typeof voixDetails === 'object') {
      const updatePromises = Object.entries(voixDetails).map(([resultatIdStr, voix]) => {
        const resultatId = parseInt(resultatIdStr, 10);
        return prisma.resultats.update({
          where: { id: resultatId },
          data: {
            nombreVoix: typeof voix === 'number' ? voix : parseInt(voix as string, 10) || 0,
            voixNuls: typeof nuls === 'number' ? nuls : 0,
            voixRejetes: typeof rejets === 'number' ? rejets : 0,
          },
        });
      });

      await Promise.all(updatePromises);
    }

    return NextResponse.json({
      success: true,
      message: 'Procès-Verbal corrigé et mis à jour avec succès.',
    });
  } catch (error) {
    console.error('Erreur API /api/admin/pvs/update:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du PV' },
      { status: 500 }
    );
  }
}