const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Connexion à la base de données...');
  
  const emailAdmin = 'admin@election.mr';

  const existingAdmin = await prisma.users.findUnique({
    where: { email: emailAdmin },
  });

  // Hachage sécurisé du mot de passe
  const hashedPassword = await bcrypt.hash('admin123', 10);

  if (!existingAdmin) {
    const admin = await prisma.users.create({
      data: {
        name: 'Administrateur Principal',
        email: emailAdmin,
        password: hashedPassword,
        role: 'admin',
        mustChangePassword: false,
      },
    });
    console.log('✅ Administrateur créé avec succès (mot de passe haché) :', admin);
  } else {
    // Mettre à jour le mot de passe si l'admin existe déjà mais n'est pas haché
    await prisma.users.update({
      where: { email: emailAdmin },
      data: { password: hashedPassword },
    });
    console.log('ℹ️ L’administrateur existait déjà. Son mot de passe a été mis à jour et haché.');
  }
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors du seed :', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });