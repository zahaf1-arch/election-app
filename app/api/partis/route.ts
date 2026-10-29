import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const availableForScope = searchParams.get('availableForScope');
    const forSaisie = searchParams.get('forSaisie');
    const electionTypeId = searchParams.get('electionTypeId');
    const wilayaId = searchParams.get('wilayaId');
    const moughataaId = searchParams.get('moughataaId');
    const communeId = searchParams.get('communeId');

    if (availableForScope === 'true' && electionTypeId) {
      const parsedElectionTypeId = parseInt(electionTypeId, 10);
      const parsedWilayaId = wilayaId ? parseInt(wilayaId, 10) : null;
      const parsedMoughataaId = moughataaId ? parseInt(moughataaId, 10) : null;
      const parsedCommuneId = communeId ? parseInt(communeId, 10) : null;

      // 🟢 Recherche large et cumulative pour capturer toutes les candidatures applicables à cette zone
      const existingCandidatures = await prisma.candidatures.findMany({
        where: {
          electionTypeId: parsedElectionTypeId,
          OR: [
            ...(parsedCommuneId ? [{ communeId: parsedCommuneId }] : []),
            ...(parsedMoughataaId ? [{ moughataaId: parsedMoughataaId }] : []),
            ...(parsedWilayaId ? [{ wilayaId: parsedWilayaId }] : []),
            { estNationale: true },
          ],
        },
        select: { partiId: true },
      });

      const assignedPartiIds = Array.from(new Set(existingCandidatures.map((c: any) => c.partiId)));

      // 🟢 Si forSaisie === 'true' -> UNIQUEMENT les partis candidats (IN)
      // 🟢 Sinon -> Uniquement les partis non affectés (NOT IN)
      const isSaisie = forSaisie === 'true';

      const partisResultat = await prisma.partis.findMany({
        where: {
          id: isSaisie
            ? { in: assignedPartiIds.length > 0 ? assignedPartiIds : [-1] }
            : { notIn: assignedPartiIds.length > 0 ? assignedPartiIds : [-1] },
        },
        orderBy: { nom_fr: 'asc' },
      });

      return NextResponse.json(partisResultat);
    }

    const allPartis = await prisma.partis.findMany({
      orderBy: { nom_fr: 'asc' },
    });

    return NextResponse.json(allPartis);
  } catch (error) {
    console.error('Erreur GET /api/partis:', error);
    return NextResponse.json([], { status: 500 });
  }
}