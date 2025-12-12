// app/api/dashboard/route.ts
// FIX: Séparer les requêtes pour inclure les commandes sans items (bons cadeaux)
import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    
    // Construire le filtre de dates en incluant toute la journée de fin
    const dateFilter = startDate && endDate ? {
      gte: new Date(startDate),
      lte: new Date(new Date(endDate).setHours(23, 59, 59, 999)),
    } : undefined
    
    // CA total (commandes confirmées) - SANS include items pour éviter les problèmes avec les commandes sans items
    const orders = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        ...(dateFilter && { date: dateFilter }),
      },
    })

    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0)

    // Pour le coût des produits, on récupère les commandes avec leurs items
    const ordersWithItems = await prisma.order.findMany({
      where: {
        status: 'CONFIRMED',
        ...(dateFilter && { date: dateFilter }),
      },
      include: {
        items: true,
      },
    })

    // Coût des produits vendus
    const totalCost = ordersWithItems.reduce((sum, order) => {
      return sum + order.items.reduce((itemSum, item) => {
        return itemSum + (item.quantity * Number(item.costPriceAtSale))
      }, 0)
    }, 0)
    
    // Dépenses
    const expenses = await prisma.expense.findMany({
      where: dateFilter ? { date: dateFilter } : undefined,
    })
    
    const totalExpenses = expenses.reduce((sum, expense) => sum + Number(expense.amount), 0)

    // Bénéfice = CA - Dépenses (les dépenses incluent déjà le coût des produits)
    // Le coût des produits est affiché séparément comme statistique mais n'est pas soustrait à nouveau
    const profit = totalRevenue - totalExpenses
    
    // Top 5 produits
    const productSales = new Map<string, { name: string; quantity: number; product: any }>()

    for (const order of ordersWithItems) {
      for (const item of order.items) {
        const variant = await prisma.productVariant.findUnique({
          where: { id: item.productVariantId },
          include: { product: true },
        })
        
        if (variant) {
          const key = variant.product.id
          const existing = productSales.get(key)
          
          if (existing) {
            existing.quantity += item.quantity
          } else {
            productSales.set(key, {
              name: variant.product.name,
              quantity: item.quantity,
              product: variant.product,
            })
          }
        }
      }
    }
    
    const topProducts = Array.from(productSales.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5)
    
    // Alertes stock bas - récupérer tous les variants et filtrer en JS
    const allVariantsForStock = await prisma.productVariant.findMany({
      include: {
        product: true,
      },
    })

    const lowStockVariants = allVariantsForStock.filter(
      variant => variant.stock < variant.minStock
    )

    // Calculs potentiels si on vend tout le stock restant
    const allVariants = await prisma.productVariant.findMany()

    const potentialRevenue = allVariants.reduce((sum, variant) => {
      return sum + (variant.stock * Number(variant.sellingPrice))
    }, 0)

    const potentialCost = allVariants.reduce((sum, variant) => {
      return sum + (variant.stock * Number(variant.costPrice))
    }, 0)

    // Bénéfice potentiel = CA potentiel - Dépenses totales
    // (car les produits en stock sont déjà payés dans les dépenses)
    const potentialProfit = potentialRevenue - totalExpenses

    // Calculs globaux = réalisé + potentiel
    const globalRevenue = totalRevenue + potentialRevenue
    const globalCost = totalCost + potentialCost
    const globalProfit = globalRevenue - totalExpenses

    return NextResponse.json({
      totalRevenue,
      totalCost,
      totalExpenses,
      profit,
      potentialRevenue,
      potentialCost,
      potentialProfit,
      globalRevenue,
      globalCost,
      globalProfit,
      topProducts,
      lowStockVariants,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des statistiques' }, { status: 500 })
  }
}