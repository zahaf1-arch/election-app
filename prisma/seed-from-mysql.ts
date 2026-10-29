import { PrismaClient } from '@prisma/client';
import mysql from 'mysql2/promise';

const prisma = new PrismaClient();

const mysqlConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'locales_db',
};

async function main() {
  console.log('🔄 Connexion à MySQL...');
  const connection = await mysql.createConnection(mysqlConfig);

  try {
    console.log('🧹 Nettoyage sécurisé de la base PostgreSQL...');
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE "resultats", "bureaux", "centres", "communes", "moughataas", "wilayas", "parties", "election_types", "User" CASCADE;
    `).catch(() => {
      console.log('   ℹ️ Nettoyage CASCADE direct...');
    });

    const getModel = (name: string) => {
      const keys = Object.keys(prisma).filter((k) => !k.startsWith('_') && !k.startsWith('$'));
      const foundKey = keys.find(
        (k) =>
          k.toLowerCase() === name.toLowerCase() ||
          k.toLowerCase() === `${name.toLowerCase()}s` ||
          k.toLowerCase() === name.toLowerCase().replace(/s$/, '')
      );
      return foundKey ? (prisma as any)[foundKey] : null;
    };

    // 1. Structure géographique
    const hierarchy = ['wilayas', 'moughataas', 'communes', 'centres', 'bureaux'];
    for (const table of hierarchy) {
      const model = getModel(table);
      if (model) {
        console.log(`📌 Migration : ${table}...`);
        const [rows]: any = await connection.query(`SELECT * FROM ${table}`);
        if (rows.length > 0) {
          await model.createMany({ data: rows, skipDuplicates: true });
          console.log(`   ✅ ${rows.length} lignes insérées dans ${table}`);
        }
      }
    }

    // 2. Migration des Partis Politiques
    const modelParties = getModel('parties') || getModel('partis');
    if (modelParties) {
      console.log("📌 Migration : Partis politiques (depuis 'partis')...");
      const [rows]: any = await connection.query('SELECT * FROM partis');
      if (rows.length > 0) {
        const formattedParties = rows.map((row: any) => ({
          ...row,
          actif: row.actif === undefined ? true : (row.actif === 1 || row.actif === true),
        }));
        await modelParties.createMany({ data: formattedParties, skipDuplicates: true });
        console.log(`   ✅ ${rows.length} partis insérés.`);
      }
    }

    // 3. Migration des Types d'Élection
    const modelElections = getModel('election_types') || getModel('election_type');
    if (modelElections) {
      console.log("📌 Migration : Types d'élection...");
      const [rows]: any = await connection.query('SELECT * FROM election_types');
      if (rows.length > 0) {
        const formattedElections = rows.map((row: any) => ({
          ...row,
          actif: row.actif === undefined ? true : (row.actif === 1 || row.actif === true),
        }));
        await modelElections.createMany({ data: formattedElections, skipDuplicates: true });
        console.log(`   ✅ ${rows.length} types d'élection insérés.`);
      }
    }

    // 4. Migration des Résultats
    const modelResultats = getModel('resultats') || getModel('resultat');
    if (modelResultats) {
      console.log('📌 Migration : Résultats...');
      const [rows]: any = await connection.query('SELECT * FROM resultats');
      if (rows.length > 0) {
        await modelResultats.createMany({ data: rows, skipDuplicates: true });
        console.log(`   ✅ ${rows.length} résultats insérés.`);
      }
    }

    // 5. Migration des Utilisateurs (avec conversion mustChangePassword Int -> Boolean)
    const modelUser = getModel('user') || getModel('users');
    if (modelUser) {
      console.log('📌 Migration : Utilisateurs...');
      let rows: any = [];
      try {
        [rows] = await connection.query('SELECT * FROM user');
      } catch {
        [rows] = await connection.query('SELECT * FROM users');
      }
      if (rows.length > 0) {
        const formattedUsers = rows.map((row: any) => ({
          ...row,
          mustChangePassword: row.mustChangePassword === 1 || row.mustChangePassword === true,
        }));
        await modelUser.createMany({ data: formattedUsers, skipDuplicates: true });
        console.log(`   ✅ ${rows.length} utilisateurs insérés.`);
      }
    }

    console.log('\n🎉 Migration intégrale MySQL ➡️ PostgreSQL terminée avec succès !');

  } catch (error: any) {
    console.error('❌ Erreur lors de la migration :', error.message || error);
  } finally {
    await connection.end();
    await prisma.$disconnect();
  }
}

main();