// Script pour tester le mot de passe
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function testPassword() {
  const email = 'admin@atelierdugymnaste.com'
  const password = 'admin123'

  try {
    const user = await prisma.user.findUnique({
      where: { email }
    })

    if (!user) {
      console.log('❌ Utilisateur non trouvé')
      return
    }

    console.log('✅ Utilisateur trouvé:', user.email)
    console.log('🔐 Hash stocké:', user.password.substring(0, 30) + '...')

    const isValid = await bcrypt.compare(password, user.password)
    console.log('\n🔑 Test du mot de passe "admin123":', isValid ? '✅ VALIDE' : '❌ INVALIDE')

    if (!isValid) {
      console.log('\n💡 Recréons le mot de passe...')
      const newHash = await bcrypt.hash('admin123', 10)
      await prisma.user.update({
        where: { id: user.id },
        data: { password: newHash }
      })
      console.log('✅ Mot de passe mis à jour!')
    }
  } catch (error) {
    console.error('❌ Erreur:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testPassword()
