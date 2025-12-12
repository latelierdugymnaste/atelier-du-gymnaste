// Script pour créer un utilisateur admin
// À exécuter avec: npx tsx scripts/create-admin.ts <email> <password>

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createAdmin() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error('❌ Usage: npx tsx scripts/create-admin.ts <email> <password>')
    process.exit(1)
  }

  try {
    // Vérifier si l'utilisateur existe déjà
    const existing = await prisma.user.findUnique({
      where: { email }
    })

    if (existing) {
      console.error(`❌ Un utilisateur avec l'email ${email} existe déjà`)
      process.exit(1)
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: 'Admin'
      }
    })

    console.log('✅ Utilisateur créé avec succès!')
    console.log(`📧 Email: ${user.email}`)
    console.log(`👤 Nom: ${user.name}`)
    console.log(`🆔 ID: ${user.id}`)
  } catch (error) {
    console.error('❌ Erreur lors de la création de l\'utilisateur:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
