import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 1. Récupérer tous les utilisateurs
export async function GET() {
  try {
    const users = await prisma.users.findMany({
      include: {
        wilayas: true,
      },
      orderBy: { id: 'asc' },
    });
    return NextResponse.json(users);
  } catch (error) {
    console.error('Erreur GET users:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// 2. Créer un nouvel utilisateur avec mot de passe par défaut
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, wilayaId } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Tous les champs obligatoires doivent être remplis' }, { status: 400 });
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.users.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: 'Cet email est déjà utilisé par un autre compte.' }, { status: 400 });
    }

    // Mot de passe par défaut sécurisé et haché
    const defaultPasswordPlain = '123456789';
    const hashedPassword = await bcrypt.hash(defaultPasswordPlain, 10);

    const newUser = await prisma.users.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        wilayaId: role === 'operator' && wilayaId ? parseInt(wilayaId, 10) : null,
        mustChangePassword: true, // Force le changement au premier login
      },
    });

    const { password: _, ...userWithoutPassword } = newUser;

    return NextResponse.json({
      success: true,
      user: userWithoutPassword,
      defaultPassword: defaultPasswordPlain, // Optionnel : peut être affiché à l'admin pour transmission
    });
  } catch (error: any) {
    console.error('Erreur POST user:', error);
    return NextResponse.json({ error: error.message || 'Erreur lors de la création de l’utilisateur' }, { status: 500 });
  }
}

// 3. Supprimer un utilisateur
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID requis' }, { status: 400 });
    }

    await prisma.users.delete({
      where: { id: parseInt(id, 10) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Erreur DELETE user:', error);
    return NextResponse.json({ error: 'Erreur lors de la suppression' }, { status: 500 });
  }
}