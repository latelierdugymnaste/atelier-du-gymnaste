// app/api/gift-cards/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { giftCardSchema } from '../../../lib/validations'

// GET - Liste tous les bons cadeaux
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') // ACTIVE, USED, EXPIRED
    const search = searchParams.get('search') // Recherche par code ou nom

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (search) {
      where.OR = [
        { code: { contains: search } },
        { recipientName: { contains: search } },
        { purchasedByName: { contains: search } },
      ]
    }

    const giftCards = await prisma.giftCard.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(giftCards)
  } catch (error) {
    console.error('Erreur dans GET /api/gift-cards:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des bons cadeaux' },
      { status: 500 }
    )
  }
}

// POST - Créer un bon cadeau
export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Données reçues dans POST /api/gift-cards:', body)

    // Convertir initialAmount en nombre
    const amount = parseFloat(body.initialAmount)
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'Le montant doit être un nombre positif' },
        { status: 400 }
      )
    }

    const validatedData = giftCardSchema.parse({
      code: body.code,
      initialAmount: amount,
      recipientName: body.recipientName || null,
      recipientEmail: body.recipientEmail || null,
      purchasedByName: body.purchasedByName || null,
      purchasedByEmail: body.purchasedByEmail || null,
      purchasedByPhone: body.purchasedByPhone || null,
      expirationDate: body.expirationDate || null,
      paymentMethod: body.paymentMethod || null,
      customerId: body.customerId || null,
    })

    console.log('Données validées:', validatedData)

    // Vérifier que le code n'existe pas déjà
    const existingGiftCard = await prisma.giftCard.findUnique({
      where: { code: validatedData.code },
    })

    if (existingGiftCard) {
      return NextResponse.json(
        { error: 'Ce code de bon cadeau existe déjà' },
        { status: 400 }
      )
    }

    // Utiliser une transaction pour créer le bon cadeau ET la commande
    const result = await prisma.$transaction(async (tx) => {
      // 1. Créer le bon cadeau
      const giftCard = await tx.giftCard.create({
        data: {
          code: validatedData.code,
          initialAmount: validatedData.initialAmount,
          remainingAmount: validatedData.initialAmount,
          recipientName: validatedData.recipientName || null,
          recipientEmail: validatedData.recipientEmail || null,
          purchasedByName: validatedData.purchasedByName || null,
          purchasedByEmail: validatedData.purchasedByEmail || null,
          purchasedByPhone: validatedData.purchasedByPhone || null,
          expirationDate: validatedData.expirationDate ? new Date(validatedData.expirationDate) : null,
          status: 'ACTIVE',
        },
      })

      // 2. Créer une commande confirmée pour l'achat du bon cadeau
      const order = await tx.order.create({
        data: {
          customerId: validatedData.customerId || null,
          customerName: validatedData.purchasedByName || 'Achat bon cadeau',
          customerEmail: validatedData.purchasedByEmail || null,
          customerPhone: validatedData.purchasedByPhone || null,
          salesChannel: 'AUTRE',
          status: 'CONFIRMED',
          date: new Date(),
          totalAmount: validatedData.initialAmount,
          tags: `Bon cadeau: ${giftCard.code}`,
          paymentMethod: validatedData.paymentMethod || null,
        },
      })

      // 3. Lier le bon cadeau à la commande d'achat
      await tx.giftCard.update({
        where: { id: giftCard.id },
        data: { purchaseOrderId: order.id },
      })

      return { giftCard, order }
    })

    console.log('Bon cadeau créé:', result.giftCard)
    console.log('Commande d\'achat créée:', result.order)
    return NextResponse.json(result.giftCard, { status: 201 })
  } catch (error: any) {
    console.error('Erreur dans POST /api/gift-cards:', error)
    if (error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Données invalides', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Erreur lors de la création du bon cadeau: ' + error.message },
      { status: 500 }
    )
  }
}

// PUT - Mettre à jour un bon cadeau
export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID du bon cadeau requis' },
        { status: 400 }
      )
    }

    const giftCard = await prisma.giftCard.update({
      where: { id },
      data: {
        recipientName: data.recipientName,
        recipientEmail: data.recipientEmail,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
        status: data.status,
      },
    })

    return NextResponse.json(giftCard)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la mise à jour du bon cadeau' },
      { status: 500 }
    )
  }
}

// PATCH - Modifier les informations d'un bon cadeau (sans modifier code et montant initial)
export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    if (!id) {
      return NextResponse.json(
        { error: 'ID du bon cadeau requis' },
        { status: 400 }
      )
    }

    // Vérifier que le bon cadeau existe
    const existingGiftCard = await prisma.giftCard.findUnique({
      where: { id },
    })

    if (!existingGiftCard) {
      return NextResponse.json(
        { error: 'Bon cadeau introuvable' },
        { status: 404 }
      )
    }

    // Mettre à jour uniquement les champs modifiables
    const giftCard = await prisma.giftCard.update({
      where: { id },
      data: {
        recipientName: data.recipientName || null,
        recipientEmail: data.recipientEmail || null,
        purchasedByName: data.purchasedByName || null,
        purchasedByEmail: data.purchasedByEmail || null,
        purchasedByPhone: data.purchasedByPhone || null,
        expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
      },
    })

    return NextResponse.json(giftCard)
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la modification du bon cadeau' },
      { status: 500 }
    )
  }
}

// DELETE - Supprimer un bon cadeau
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'ID du bon cadeau requis' },
        { status: 400 }
      )
    }

    // Vérifier si le bon cadeau a été utilisé
    const giftCard = await prisma.giftCard.findUnique({
      where: { id },
      include: { usedInOrders: true },
    })

    if (!giftCard) {
      return NextResponse.json(
        { error: 'Bon cadeau introuvable' },
        { status: 404 }
      )
    }

    if (giftCard.usedInOrders.length > 0) {
      return NextResponse.json(
        { error: 'Impossible de supprimer un bon cadeau déjà utilisé' },
        { status: 400 }
      )
    }

    await prisma.giftCard.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du bon cadeau' },
      { status: 500 }
    )
  }
}
