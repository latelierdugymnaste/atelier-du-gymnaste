// app/api/products/[id]/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = params.id

    // Récupérer le produit avec ses variantes
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: true
      }
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouvé' }, { status: 404 })
    }

    // Récupérer tous les IDs des variantes de ce produit
    const variantIds = product.variants.map(v => v.id)

    // Récupérer tous les orderItems qui contiennent ces variantes
    const orderItems = await prisma.orderItem.findMany({
      where: {
        productVariantId: { in: variantIds }
      },
      include: {
        order: {
          include: {
            customer: true
          }
        },
        productVariant: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        order: {
          createdAt: 'desc'
        }
      }
    })

    // Grouper par commande et calculer les statistiques
    const ordersMap = new Map()
    let totalQuantitySold = 0
    let totalRevenue = 0

    orderItems.forEach(item => {
      const orderId = item.order.id
      totalQuantitySold += item.quantity
      totalRevenue += Number(item.lineTotal)

      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          id: item.order.id,
          date: item.order.date,
          createdAt: item.order.createdAt,
          customerName: item.order.customerName,
          customerEmail: item.order.customerEmail,
          customerPhone: item.order.customerPhone,
          status: item.order.status,
          salesChannel: item.order.salesChannel,
          paymentMethod: item.order.paymentMethod,
          totalAmount: item.order.totalAmount,
          items: []
        })
      }

      ordersMap.get(orderId).items.push({
        id: item.id,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        lineTotal: item.lineTotal,
        variantSize: item.productVariant.size
      })
    })

    const orders = Array.from(ordersMap.values())

    // Calculer le stock actuel total
    const currentStock = product.variants.reduce((sum, v) => sum + v.stock, 0)

    // Compter le nombre de commandes uniques
    const orderCount = orders.length

    return NextResponse.json({
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        variantCount: product.variants.length
      },
      stats: {
        totalQuantitySold,
        totalRevenue,
        orderCount,
        currentStock
      },
      orders
    })

  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
