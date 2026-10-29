import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Fonction de répartition proportionnelle des sièges (Quotient électoral & Plus forte moyenne)
function calculerSiegesPartis(partisSummary: any[], totalVoixGlobal: number, nombreTotalSieges: number) {
  if (totalVoixGlobal === 0 || nombreTotalSieges === 0) {
    return partisSummary.map(p => ({ ...p, sieges: 0 }));
  }

  const quotientElectoral = totalVoixGlobal / nombreTotalSieges;
  let siegesAttribuesTotal = 0;

  const attribution = partisSummary.map((parti) => {
    const division = parti.totalVoix / quotientElectoral;
    const siegesDirects = Math.floor(division);
    siegesAttribuesTotal += siegesDirects;

    return {
      ...parti,
      sieges: siegesDirects,
    };
  });

  // Attribution des sièges restants via la Plus Forte Moyenne
  let siegesRestants = nombreTotalSieges - siegesAttribuesTotal;

  while (siegesRestants > 0) {
    let meilleurIndice = -1;
    let plusForteMoyenne = -1;

    attribution.forEach((parti, index) => {
      const moyenne = parti.totalVoix / (parti.sieges + 1);
      if (moyenne > plusForteMoyenne) {
        plusForteMoyenne = moyenne;
        meilleurIndice = index;
      }
    });

    if (meilleurIndice !== -1) {
      attribution[meilleurIndice].sieges += 1;
      siegesRestants--;
    } else {
      break;
    }
  }

  return attribution;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('type');
    const wilayaIdStr = searchParams.get('wilayaId');
    const moughataaIdStr = searchParams.get('moughataaId');
    const communeIdStr = searchParams.get('communeId');
    const centreIdStr = searchParams.get('centreId');
    const bureauIdStr = searchParams.get('bureauId');

    if (!code) {
      return NextResponse.json({ error: 'Code d’élection requis' }, { status: 400 });
    }

    // 1. Recherche du type d'élection
    const electionType = await prisma.election_types.findFirst({
      where: {
        code: {
          equals: code,
          mode: 'insensitive',
        },
      },
    });

    if (!electionType) {
      return NextResponse.json({ error: 'Type d’élection introuvable' }, { status: 404 });
    }

    const parsedWilayaId = wilayaIdStr ? parseInt(wilayaIdStr, 10) : null;
    const parsedMoughataaId = moughataaIdStr ? parseInt(moughataaIdStr, 10) : null;
    const parsedCommuneId = communeIdStr ? parseInt(communeIdStr, 10) : null;
    const parsedCentreId = centreIdStr ? parseInt(centreIdStr, 10) : null;
    const parsedBureauId = bureauIdStr ? parseInt(bureauIdStr, 10) : null;

    let targetBureauIds: number[] | null = null;

    const nouakchottWilayaIds: number[] = [13, 14, 15]; 
    const isNouakchottWilaya = parsedWilayaId && nouakchottWilayaIds.includes(parsedWilayaId);
    const upperCode = electionType.code.toUpperCase();
    const isRegionalScrutin = upperCode.includes('REGIONAL');
    const isDepartementalScrutin = upperCode.includes('DEPARTEMENT') || upperCode.includes('LEGISLATIVE');

    if (parsedBureauId) {
      targetBureauIds = [parsedBureauId];
    } else if (parsedCentreId) {
      const bureaux = await prisma.bureaux.findMany({
        where: { centreId: parsedCentreId },
        select: { id: true },
      });
      targetBureauIds = bureaux.map((b) => b.id);
    } else if (parsedCommuneId) {
      const centres = await prisma.centres.findMany({
        where: { communeId: parsedCommuneId },
        select: { id: true },
      });
      const centreIds = centres.map((c) => c.id);

      const bureaux = await prisma.bureaux.findMany({
        where: { centreId: { in: centreIds.length > 0 ? centreIds : [-999] } },
        select: { id: true },
      });
      targetBureauIds = bureaux.map((b) => b.id);
    } else if (parsedMoughataaId) {
      const communes = await prisma.communes.findMany({
        where: { moughataaId: parsedMoughataaId },
        select: { id: true },
      });
      const communeIds = communes.map((c) => c.id);

      const centres = await prisma.centres.findMany({
        where: { communeId: { in: communeIds.length > 0 ? communeIds : [-999] } },
        select: { id: true },
      });
      const centreIds = centres.map((c) => c.id);

      const bureaux = await prisma.bureaux.findMany({
        where: { centreId: { in: centreIds.length > 0 ? centreIds : [-999] } },
        select: { id: true },
      });
      targetBureauIds = bureaux.map((b) => b.id);
    } else if (parsedWilayaId) {
      let wilayaIdsToQuery: number[] = [parsedWilayaId];
      
      // Si c'est Régional OU Départemental à Nouakchott, on interroge les wilayas de Nouakchott concernées
      if (isNouakchottWilaya && isRegionalScrutin) {
        wilayaIdsToQuery = nouakchottWilayaIds; // Cumul des 3 wilayas pour le régional
      }
      // Pour le départemental à Nouakchott, si on sélectionne une Wilaya (ex: Nouakchott-Sud), 
      // wilayaIdsToQuery reste [parsedWilayaId] mais va cumuler toutes ses moughataas ci-dessous.

      const moughataas = await prisma.moughataas.findMany({
        where: { wilayaId: { in: wilayaIdsToQuery } },
        select: { id: true },
      });
      const moughataaIds = moughataas.map((m) => m.id);

      const communes = await prisma.communes.findMany({
        where: { moughataaId: { in: moughataaIds.length > 0 ? moughataaIds : [-999] } },
        select: { id: true },
      });
      const communeIds = communes.map((c) => c.id);

      const centres = await prisma.centres.findMany({
        where: { communeId: { in: communeIds.length > 0 ? communeIds : [-999] } },
        select: { id: true },
      });
      const centreIds = centres.map((c) => c.id);

      const bureaux = await prisma.bureaux.findMany({
        where: { centreId: { in: centreIds.length > 0 ? centreIds : [-999] } },
        select: { id: true },
      });
      targetBureauIds = bureaux.map((b) => b.id);
    } else {
      targetBureauIds = null;
    }

    // 2. Détermination dynamique du nombre total de sièges à pourvoir
    let nombreTotalSieges = 0;

    if (upperCode.includes('COMMUNAL') && parsedCommuneId) {
      const commune = await prisma.communes.findUnique({
        where: { id: parsedCommuneId },
        select: { sieges: true }
      });
      nombreTotalSieges = commune?.sieges || 9;
    } 
    else if (upperCode.includes('DEPARTEMENT') || upperCode.includes('LEGISLATIVE')) {
      if (isNouakchottWilaya) {
        nombreTotalSieges = 11; // 11 sièges pour les wilayas de Nouakchott au niveau départemental
      } else if (parsedMoughataaId) {
        const moughataa = await prisma.moughataas.findUnique({
          where: { id: parsedMoughataaId },
          select: { sieges: true }
        });
        nombreTotalSieges = moughataa?.sieges || 2;
      } else {
        nombreTotalSieges = 11;
      }
    } 
    else if (upperCode.includes('REGIONAL')) {
      if (isNouakchottWilaya) {
        nombreTotalSieges = 21; // Conseil régional de Nouakchott (21 conseillers)
      } else if (parsedWilayaId) {
        const wilaya = await prisma.wilayas.findUnique({
          where: { id: parsedWilayaId },
          select: { sieges: true }
        });
        nombreTotalSieges = wilaya?.sieges || 11;
      } else {
        nombreTotalSieges = 11;
      }
    } 
    else if (upperCode.includes('FEMME')) {
      nombreTotalSieges = 20; 
    } 
    else if (upperCode.includes('JEUNE')) {
      nombreTotalSieges = 11; 
    } 
    else {
      nombreTotalSieges = 20; 
    }

    // 3. Condition de recherche des résultats
    const whereCondition: any = {
      electionTypeId: electionType.id,
    };

    if (targetBureauIds !== null) {
      whereCondition.bureauId = {
        in: targetBureauIds.length > 0 ? targetBureauIds : [-999],
      };
    }

    // 4. Récupération des résultats
    const resList = await prisma.resultats.findMany({
      where: whereCondition,
      include: {
        partis: true,
        bureaux: {
          include: {
            centres: {
              include: {
                communes: true,
              },
            },
          },
        },
      } as any,
    });

    console.log(`[API Resultats] Trouvé ${resList.length} lignes de résultats pour electionTypeId=${electionType.id} (Sièges à pourvoir: ${nombreTotalSieges})`);

    // 5. Agrégation par parti
    const partisMap = new Map();
    let totalVoixGlobal = 0;

    resList.forEach((r: any) => {
      const partiObj = r.partis;
      const pId = r.partiId;
      const voix = r.nombreVoix || r.voix || 0;
      totalVoixGlobal += voix;

      if (!partisMap.has(pId)) {
        partisMap.set(pId, {
          partiId: pId,
          nom_fr: partiObj?.nom_fr || partiObj?.nom || `Parti #${pId}`,
          nom_ar: partiObj?.nom_ar || `حزب #${pId}`,
          sigle: partiObj?.sigle || '',
          totalVoix: 0,
        });
      }

      const item = partisMap.get(pId);
      item.totalVoix += voix;
    });

    let partisSummary = Array.from(partisMap.values())
      .map((p: any) => ({
        ...p,
        pourcentage: totalVoixGlobal > 0 ? ((p.totalVoix / totalVoixGlobal) * 100).toFixed(2) : '0.00',
      }))
      .sort((a, b) => b.totalVoix - a.totalVoix);

    // 6. Calcul automatique des sièges selon le nombre total et les voix
    partisSummary = calculerSiegesPartis(partisSummary, totalVoixGlobal, nombreTotalSieges);

    // 7. Extraction des PVs
    const pvsMap = new Map();
    resList.forEach((r: any) => {
      const bureauObj = r.bureaux;
      const centreObj = bureauObj?.centres;
      if (!pvsMap.has(r.bureauId)) {
        pvsMap.set(r.bureauId, {
          bureauId: r.bureauId,
          bureauNom: bureauObj?.nom_fr || bureauObj?.nom || `Bureau #${r.bureauId}`,
          centreNom: centreObj?.nom_fr || centreObj?.nom || '',
          communeNom: centreObj?.communes?.nom_fr || centreObj?.communes?.nom || '',
          pvImage: r.pvImage,
        });
      }
    });

    return NextResponse.json({
      totalVoixGlobal,
      nombreTotalSieges,
      partisSummary,
      pvs: Array.from(pvsMap.values()),
    });
  } catch (error) {
    console.error('Erreur API /api/resultats:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}