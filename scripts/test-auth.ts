// Script pour tester l'authentification
import bcrypt from 'bcryptjs'

const testPassword = 'e!Ndfcx#HWDuH9H'
const email = 'latelierdugymnaste@gmail.com'

async function testAuth() {
  console.log('🔐 Test d\'authentification locale')
  console.log('Email:', email)
  console.log('Mot de passe:', testPassword)
  console.log('')

  try {
    // Test 1: Simuler la requête de connexion
    console.log('📡 Envoi de la requête d\'authentification...')
    const response = await fetch('http://localhost:3003/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        email: email,
        password: testPassword,
        callbackUrl: 'http://localhost:3003/',
        json: 'true'
      })
    })

    console.log('📊 Status:', response.status)
    console.log('📊 Headers:', Object.fromEntries(response.headers))

    const text = await response.text()
    console.log('📊 Response:', text.substring(0, 500))

    if (response.ok) {
      console.log('✅ Authentification réussie!')
    } else {
      console.log('❌ Authentification échouée')
    }

  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

testAuth()
