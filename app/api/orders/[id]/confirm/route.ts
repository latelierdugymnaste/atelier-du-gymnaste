// app/api/orders/[id]/confirm/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '../../../../../lib/prisma'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    })
    
    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvée' }, { status: 404 })
    }
    
    if (order.status === 'CONFIRMED') {
      return NextResponse.json({ error: 'Commande déjà confirmée' }, { status: 400 })
    }
    
    // Vérifier le stock disponible
    for (const item of order.items) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: item.productVariantId },
      })
      
      if (!variant || variant.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stock insuffisant pour l'article ${item.productVariantId}` },
          { status: 400 }
        )
      }
    }
    
    // Préparer les transactions
    const transactions: any[] = [
      // Décrémenter le stock
      ...order.items.map((item) =>
        prisma.productVariant.update({
          where: { id: item.productVariantId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        })
      ),
      // Confirmer la commande
      prisma.order.update({
        where: { id: params.id },
        data: { status: 'CONFIRMED' },
      }),
    ]

    // Si un bon cadeau a été utilisé, mettre à jour son solde
    if (order.giftCardCode && Number(order.giftCardDiscount) > 0) {
      const giftCard = await prisma.giftCard.findUnique({
        where: { code: order.giftCardCode },
      })

      if (giftCard) {
        const newRemainingAmount = Number(giftCard.remainingAmount) - Number(order.giftCardDiscount)
        const newStatus = newRemainingAmount <= 0 ? 'USED' : 'ACTIVE'

        transactions.push(
          prisma.giftCard.update({
            where: { code: order.giftCardCode },
            data: {
              remainingAmount: Math.max(0, newRemainingAmount),
              status: newStatus,
            },
          })
        )
      }
    }

    // Exécuter toutes les transactions
    await prisma.$transaction(transactions)
    
    const updatedOrder = await prisma.order.findUnique({
      where: { id: params.id },
      include: { items: true },
    })
    
    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la confirmation de la commande' }, { status: 500 })
  }
}