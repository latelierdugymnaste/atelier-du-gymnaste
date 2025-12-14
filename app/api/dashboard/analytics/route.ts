// app/api/dashboard/analytics/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Construire le filtre de dates
    const dateFilter = startDate && endDate ? {
      gte: new Date(startDate),
      lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
    } : undefined

    // Récupérer les commandes confirmées avec leurs items
    const orders = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        ...(dateFilter && { date: dateFilter }),
      },
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true
              }
            }
          }
        }
      }
    })

    // ===== 1. PRODUITS LES PLUS RENTABLES (marge unitaire × volume) =====
    const productProfitability = new Map<string, {
      productId: string
      productName: string
      totalQuantity: number
      totalRevenue: number
      totalCost: number
      totalProfit: number
      unitMargin: number
    }>()

    for (const order of orders) {
      for (const item of order.items) {
        const productId = item.productVariant.product.id
        const productName = item.productVariant.product.name
        const revenue = Number(item.unitPrice) * item.quantity
        const cost = Number(item.costPriceAtSale) * item.quantity
        const profit = revenue - cost
        const unitMargin = Number(item.unitPrice) - Number(item.costPriceAtSale)

        const existing = productProfitability.get(productId)

        if (existing) {
          existing.totalQuantity += item.quantity
          existing.totalRevenue += revenue
          existing.totalCost += cost
          existing.totalProfit += profit
          // Recalculer la marge unitaire moyenne
          existing.unitMargin = (existing.totalRevenue - existing.totalCost) / existing.totalQuantity
        } else {
          productProfitability.set(productId, {
            productId,
            productName,
            totalQuantity: item.quantity,
            totalRevenue: revenue,
            totalCost: cost,
            totalProfit: profit,
            unitMargin
          })
        }
      }
    }

    // Trier par rentabilité totale (marge unitaire × volume) décroissante
    const mostProfitableProducts = Array.from(productProfitability.values())
      .sort((a, b) => b.totalProfit - a.totalProfit)
      .slice(0, 5)
      .map(p => ({
        productName: p.productName,
        totalQuantity: p.totalQuantity,
        totalRevenue: p.totalRevenue,
        totalCost: p.totalCost,
        totalProfit: p.totalProfit,
        unitMargin: p.unitMargin
      }))

    // ===== 2. CANAUX DE VENTE LES PLUS PERFORMANTS =====
    const salesChannelPerformance = new Map<string, {
      channel: string
      orderCount: number
      totalRevenue: number
      totalCost: number
      totalProfit: number
    }>()

    for (const order of orders) {
      const channel = order.salesChannel
      const revenue = Number(order.totalAmount)

      // Calculer le coût total des items de cette commande
      const cost = order.items.reduce((sum, item) => {
        return sum + (Number(item.costPriceAtSale) * item.quantity)
      }, 0)

      const profit = revenue - cost

      const existing = salesChannelPerformance.get(channel)

      if (existing) {
        existing.orderCount += 1
        existing.totalRevenue += revenue
        existing.totalCost += cost
        existing.totalProfit += profit
      } else {
        salesChannelPerformance.set(channel, {
          channel,
          orderCount: 1,
          totalRevenue: revenue,
          totalCost: cost,
          totalProfit: profit
        })
      }
    }

    // Trier par CA décroissant
    const bestPerformingChannels = Array.from(salesChannelPerformance.values())
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .map(c => ({
        channel: c.channel,
        orderCount: c.orderCount,
        totalRevenue: c.totalRevenue,
        totalCost: c.totalCost,
        totalProfit: c.totalProfit,
        profitMargin: c.totalRevenue > 0 ? (c.totalProfit / c.totalRevenue) * 100 : 0
      }))

    // ===== 3. PANIER MOYEN PAR CANAL DE VENTE =====
    const averageCartByChannel = Array.from(salesChannelPerformance.values())
      .map(c => ({
        channel: c.channel,
        orderCount: c.orderCount,
        totalRevenue: c.totalRevenue,
        averageCart: c.orderCount > 0 ? c.totalRevenue / c.orderCount : 0
      }))
      .sort((a, b) => b.averageCart - a.averageCart)

    return NextResponse.json({
      mostProfitableProducts,
      bestPerformingChannels,
      averageCartByChannel
    })
  } catch (error) {
    console.error('Erreur lors de la récupération des analytics:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des analytics' },
      { status: 500 }
    )
  }
}
