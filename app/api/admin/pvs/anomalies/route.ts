import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: Request) {
  try {
    // Récupération de tous les bureaux avec leurs résultats et infos géographiques
    const bureaux = await prisma.bureaux.findMany({
      include: {
        centres: {
          include: {
            communes: {
              include: {
                moughataas: {
                  include: {
                    wilayas: true,
                  },
                },
              },
            },
          },
        },
        resultats: {
          include: {
            partis: true,
            election_types: true,
          },
        },
      },
    });

    const pvsAnomalies: any[] = [];

    // Groupement des résultats par Bureau et par Type d'élection
    bureaux.forEach((bureau) => {
      // 1. Inscrits & Votants provenant de la table 'bureaux'
      const inscrits = bureau.nombreInscrits || 0;
      const votants = bureau.nombreVotants || 0;

      const mapElections = new Map<number, any[]>();
      bureau.resultats.forEach((res) => {
        if (!mapElections.has(res.electionTypeId)) {
          mapElections.set(res.electionTypeId, []);
        }
        mapElections.get(res.electionTypeId)!.push(res);
      });

      mapElections.forEach((lignesResultats, electionTypeId) => {
        const electionType = lignesResultats[0]?.election_types;
        const pvImage = lignesResultats[0]?.pvImage || null;

        // 2. Nuls et Rejets provenant de la table 'resultats' (première ligne de l'élection)
        const premierResultat = lignesResultats[0] || {};
        const nuls = premierResultat.voixNuls || 0;
        const rejets = premierResultat.voixRejetes || 0;

        // Somme des voix des candidats/partis
        const sommeVoixCandidats = lignesResultats.reduce(
          (sum, r) => sum + (r.nombreVoix || 0),
          0
        );

        // Liste des anomalies détectées
        const erreurs: string[] = [];

        // 🔴 Règle 1: Votants > Inscrits
        if (inscrits > 0 && votants > inscrits) {
          erreurs.push(
            `Nombre de votants (${votants}) supérieur aux inscrits (${inscrits})`
          );
        }

        // 🔴 Règle 2: Bulletins Nuls + Rejetés > Votants
        if (nuls + rejets > votants && votants > 0) {
          erreurs.push(
            `Bulletins Nuls (${nuls}) + Rejetés (${rejets}) supérieurs aux votants (${votants})`
          );
        }

        // 🔴 Règle 3: Somme des Voix candidats + Nuls + Rejetés != Votants
        const totalCalcul = sommeVoixCandidats + nuls + rejets;
        if (votants > 0 && totalCalcul !== votants) {
          erreurs.push(
            `Incohérence du total: Voix candidats (${sommeVoixCandidats}) + Nuls (${nuls}) + Rejetés (${rejets}) = ${totalCalcul} ≠ Votants (${votants})`
          );
        }

        // 🔴 Règle 4: Voix enregistrées mais Votants = 0
        if (sommeVoixCandidats > 0 && votants === 0) {
          erreurs.push(
            `Voix candidates enregistrées (${sommeVoixCandidats}) alors que le nombre de votants = 0`
          );
        }

        // Si au moins une incohérence est détectée
        if (erreurs.length > 0) {
          pvsAnomalies.push({
            bureauId: bureau.id,
            bureauNom: bureau.nom_fr || bureau.nom_ar || `Bureau #${bureau.id}`,
            centreNom: bureau.centres?.nom_fr || bureau.centres?.nom_ar || '',
            communeNom: bureau.centres?.communes?.nom_fr || bureau.centres?.communes?.nom_ar || '',
            moughataaNom: bureau.centres?.communes?.moughataas?.nom_fr || bureau.centres?.communes?.moughataas?.nom_ar || '',
            wilayaNom: bureau.centres?.communes?.moughataas?.wilayas?.nom_fr || bureau.centres?.communes?.moughataas?.wilayas?.nom_ar || '',
            electionTypeId,
            electionCode: electionType?.code || '',
            electionNom: electionType?.nom_fr || electionType?.code || '',
            inscrits,
            votants,
            nuls,
            rejets,
            sommeVoixCandidats,
            pvImage,
            erreurs,
            lignesResultats: lignesResultats.map((r) => ({
              id: r.id,
              partiId: r.partiId,
              partiNom: r.partis?.nom_fr || r.partis?.nom_ar || `Parti #${r.partiId}`,
              voix: r.nombreVoix || 0,
            })),
          });
        }
      });
    });

    return NextResponse.json({
      totalAnomalies: pvsAnomalies.length,
      anomalies: pvsAnomalies,
    });
  } catch (error) {
    console.error('Erreur API Anomalies:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la détection des anomalies' },
      { status: 500 }
    );
  }
}