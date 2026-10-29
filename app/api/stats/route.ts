import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const totalBureaux = await prisma.bureaux.count();
    const totalWilayas = await prisma.wilayas.count();
    const totalMoughataas = await prisma.moughataas.count();
    
    const partiModel = (prisma as any).parties || (prisma as any).parti;
    const totalPartis = partiModel ? await partiModel.count() : 0;
    
    const electionTypes = await prisma.election_types.findMany();

    const bureauxAvecResultats = await prisma.resultats.groupBy({
      by: ['bureauId'],
    });
    const bureauxSaisisCount = bureauxAvecResultats.length;
    const tauxDepouillement = totalBureaux > 0 ? ((bureauxSaisisCount / totalBureaux) * 100).toFixed(1) : 0;

    return NextResponse.json({
      totalBureaux,
      totalWilayas,
      totalMoughataas,
      totalPartis,
      electionTypes,
      bureauxSaisisCount,
      tauxDepouillement,
    });
  } catch (error) {
    console.error('Erreur API stats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}