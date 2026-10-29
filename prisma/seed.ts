import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Nettoyer ou créer l'administrateur par défaut
  const emailAdmin = 'admin@election.mr';

  const existingAdmin = await prisma.users.findUnique({
    where: { email: emailAdmin },
  });

  if (!existingAdmin) {
    const admin = await prisma.users.create({
      data: {
        name: 'Administrateur Principal',
        email: emailAdmin,
        password: 'admin123', // Pensez à le modifier ou le hacher si besoin
        role: 'admin',
        mustChangePassword: false,
      },
    });
    console.log('✅ Administrateur créé avec succès :', admin);
  } else {
    console.log('ℹ️ L’administrateur existe déjà.');
  }
}

main()
  .catch((e) => {
    console.error('Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });