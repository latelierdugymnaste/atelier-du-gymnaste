// app/api/gift-cards/validate/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { applyGiftCardSchema } from '../../../../lib/validations'

// POST - Valider et calculer la réduction d'un bon cadeau
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validatedData = applyGiftCardSchema.parse({
      code: body.code,
      orderAmount: parseFloat(body.orderAmount),
    })

    // Récupérer le bon cadeau
    const giftCard = await prisma.giftCard.findUnique({
      where: { code: validatedData.code },
    })

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Code de bon cadeau invalide' },
        { status: 404 }
      )
    }

    // Vérifier le statut
    if (giftCard.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Ce bon cadeau n\'est plus actif' },
        { status: 400 }
      )
    }

    // Vérifier la date d'expiration
    if (giftCard.expirationDate && new Date(giftCard.expirationDate) < new Date()) {
      return NextResponse.json(
        { error: 'Ce bon cadeau a expiré' },
        { status: 400 }
      )
    }

    // Vérifier le montant restant
    if (Number(giftCard.remainingAmount) <= 0) {
      return NextResponse.json(
        { error: 'Ce bon cadeau a été entièrement utilisé' },
        { status: 400 }
      )
    }

    // Calculer la réduction applicable
    const remainingAmount = Number(giftCard.remainingAmount)
    const discount = Math.min(remainingAmount, validatedData.orderAmount)
    const newRemainingAmount = remainingAmount - discount

    return NextResponse.json({
      valid: true,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        initialAmount: Number(giftCard.initialAmount),
        remainingAmount: remainingAmount,
      },
      discount,
      newRemainingAmount,
    })
  } catch (error: any) {
    console.error(error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur lors de la validation du bon cadeau' },
      { status: 500 }
    )
  }
}
