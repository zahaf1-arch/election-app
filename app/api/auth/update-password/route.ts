import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { userId, newPassword } = await request.json();

    if (!userId || !newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Le nouveau mot de passe doit contenir au moins 6 caractères.' }, { status: 400 });
    }

    // Hachage du nouveau mot de passe
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Mise à jour de l'utilisateur et passage de mustChangePassword à false
    const updatedUser = await prisma.users.update({
      where: { id: parseInt(userId, 10) },
      data: {
        password: hashedPassword,
        mustChangePassword: false,
      },
    });

    const { password: _, ...userWithoutPassword } = updatedUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error('Erreur mise à jour password:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour du mot de passe' }, { status: 500 });
  }
}