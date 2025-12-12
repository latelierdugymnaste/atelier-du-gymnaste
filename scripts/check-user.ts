// Script pour vérifier si un utilisateur existe
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkUser() {
  try {
    const users = await prisma.user.findMany()
    console.log('Utilisateurs dans la base de données:', users.length)

    for (const user of users) {
      console.log(`\n📧 Email: ${user.email}`)
      console.log(`👤 Nom: ${user.name}`)
      console.log(`🆔 ID: ${user.id}`)
      console.log(`🔐 Password hash: ${user.password.substring(0, 20)}...`)
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
