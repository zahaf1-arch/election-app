import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'operator@election.mr';
  const newPasswordPlain = 'Operator123*'; // Nouveau mot de passe temporaire

  // Hashage du mot de passe avec bcrypt
  const hashedPassword = await bcrypt.hash(newPasswordPlain, 10);

  // Mise à jour de l'administrateur
  const updatedUser = await prisma.users.update({
    where: { email },
    data: { 
      password: hashedPassword,
      mustChangePassword: false 
    },
  });

  console.log(`✅ Mot de passe réinitialisé avec succès pour : ${updatedUser.email}`);
  console.log(`🔑 Nouveau mot de passe temporaire : ${newPasswordPlain}`);
}

main()
  .catch((e) => {
    console.error('❌ Erreur lors de la réinitialisation :', e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });