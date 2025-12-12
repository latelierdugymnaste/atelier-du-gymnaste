// app/api/gift-cards/generate-code/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

// Fonction pour générer un code unique
function generateGiftCardCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // Sans I, O, 0, 1 pour éviter confusion
  let code = 'GIFT-'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// GET - Générer un nouveau code unique
export async function GET() {
  try {
    let code: string = ''
    let isUnique = false
    let attempts = 0
    const maxAttempts = 10

    // Générer un code unique
    while (!isUnique && attempts < maxAttempts) {
      code = generateGiftCardCode()
      const existing = await prisma.giftCard.findUnique({
        where: { code },
      })
      if (!existing) {
        isUnique = true
        return NextResponse.json({ code })
      }
      attempts++
    }

    console.error('Impossible de générer un code unique après', maxAttempts, 'tentatives')
    return NextResponse.json(
      { error: 'Impossible de générer un code unique' },
      { status: 500 }
    )
  } catch (error) {
    console.error('Erreur dans generate-code:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la génération du code' },
      { status: 500 }
    )
  }
}
