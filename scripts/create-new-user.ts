// Script pour créer un nouvel utilisateur
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_qg4df8rMmRpi@ep-sweet-wildflower-agrplesm-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
})

async function createNewUser() {
  const email = 'latelierdugymnaste@gmail.com'
  const password = 'e!Ndfcx#HWDuH9H'
  const name = "L'Atelier du Gymnaste"

  try {
    console.log('🔐 Création du hash du mot de passe...')
    const hashedPassword = await bcrypt.hash(password, 10)
    console.log('✅ Hash créé:', hashedPassword.substring(0, 30) + '...')

    console.log('\n👤 Vérification si l\'utilisateur existe déjà...')
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      console.log('⚠️  L\'utilisateur existe déjà, mise à jour du mot de passe...')
      const updatedUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: { password: hashedPassword }
      })
      console.log('✅ Mot de passe mis à jour pour:', updatedUser.email)
    } else {
      console.log('➕ Création du nouvel utilisateur...')
      const newUser = await prisma.user.create({
        data: {
          email,
          name,
          password: hashedPassword
        }
      })
      console.log('✅ Utilisateur créé:', newUser.email)
    }

    console.log('\n🧪 Test de validation du mot de passe...')
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (user) {
      const isValid = await bcrypt.compare(password, user.password)
      console.log('✅ Test de validation:', isValid ? '✅ VALIDE' : '❌ INVALIDE')
    }

    console.log('\n✅ TERMINÉ! Vous pouvez maintenant vous connecter avec:')
    console.log('   Email:', email)
    console.log('   Mot de passe:', password)

  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

createNewUser()
