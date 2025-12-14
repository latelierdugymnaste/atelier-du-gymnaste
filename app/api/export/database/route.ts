// app/api/export/database/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Récupérer toutes les données en parallèle
    const [
      products,
      orders,
      customers,
      expenses,
      giftCards,
      dashboardStats
    ] = await Promise.all([
      // Produits avec leurs variantes
      prisma.product.findMany({
        include: {
          variants: {
            orderBy: { size: 'asc' }
          }
        },
        orderBy: { name: 'asc' }
      }),

      // Commandes avec tous les détails
      prisma.order.findMany({
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
        },
        orderBy: { createdAt: 'desc' }
      }),

      // Clients avec leur historique
      prisma.customer.findMany({
        include: {
          orders: true
        },
        orderBy: { name: 'asc' }
      }),

      // Dépenses
      prisma.expense.findMany({
        orderBy: { date: 'desc' }
      }),

      // Bons cadeaux
      prisma.giftCard.findMany({
        orderBy: { createdAt: 'desc' }
      }),

      // Statistiques du dashboard
      Promise.all([
        prisma.order.count(),
        prisma.order.aggregate({ _sum: { totalAmount: true } }),
        prisma.expense.aggregate({ _sum: { amount: true } }),
        prisma.product.count(),
        prisma.customer.count(),
        prisma.giftCard.count(),
        prisma.giftCard.aggregate({ _sum: { remainingAmount: true } })
      ])
    ])

    // Calculer les statistiques du dashboard
    const [
      totalOrders,
      totalRevenue,
      totalExpenses,
      totalProducts,
      totalCustomers,
      totalGiftCards,
      totalGiftCardBalance
    ] = dashboardStats

    // Préparer les données des produits avec stock total
    const productsData = products.map(product => ({
      id: product.id,
      name: product.name,
      category: product.category,
      sku: product.sku,
      isActive: product.isActive,
      variantCount: product.variants.length,
      totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
      variants: product.variants.map(v => ({
        id: v.id,
        size: v.size,
        stock: v.stock,
        minStock: v.minStock,
        costPrice: Number(v.costPrice),
        sellingPrice: Number(v.sellingPrice)
      }))
    }))

    // Préparer les données des commandes
    const ordersData = orders.map(order => ({
      id: order.id,
      date: order.date,
      createdAt: order.createdAt,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      status: order.status,
      salesChannel: order.salesChannel,
      paymentMethod: order.paymentMethod,
      totalAmount: Number(order.totalAmount),
      tags: order.tags,
      itemCount: order.items.length,
      items: order.items.map(item => ({
        productName: item.productVariant.product.name,
        variantSize: item.productVariant.size,
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice),
        lineTotal: Number(item.lineTotal)
      }))
    }))

    // Préparer les données des clients
    const customersData = customers.map(customer => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      totalOrders: customer.orders.length,
      totalSpent: customer.orders.reduce((sum, order) => sum + Number(order.totalAmount), 0),
      createdAt: customer.createdAt
    }))

    // Préparer les données des dépenses
    const expensesData = expenses.map(expense => ({
      id: expense.id,
      date: expense.date,
      category: expense.category,
      description: expense.description,
      amount: Number(expense.amount),
      invoiceUrl: expense.invoiceUrl,
      createdAt: expense.createdAt
    }))

    // Préparer les données des bons cadeaux
    const giftCardsData = giftCards.map(card => ({
      id: card.id,
      code: card.code,
      initialAmount: Number(card.initialAmount),
      remainingAmount: Number(card.remainingAmount),
      status: card.status,
      recipientName: card.recipientName,
      recipientEmail: card.recipientEmail,
      purchasedByName: card.purchasedByName,
      purchasedByEmail: card.purchasedByEmail,
      expirationDate: card.expirationDate,
      createdAt: card.createdAt
    }))

    // Préparer les statistiques
    const statistics = {
      totalOrders,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      totalExpenses: Number(totalExpenses._sum.amount || 0),
      netProfit: Number(totalRevenue._sum.totalAmount || 0) - Number(totalExpenses._sum.amount || 0),
      totalProducts,
      totalCustomers,
      totalGiftCards,
      totalGiftCardBalance: Number(totalGiftCardBalance._sum.remainingAmount || 0)
    }

    return NextResponse.json({
      products: productsData,
      orders: ordersData,
      customers: customersData,
      expenses: expensesData,
      giftCards: giftCardsData,
      statistics
    })

  } catch (error) {
    console.error('Erreur lors de l\'export:', error)
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des données' },
      { status: 500 }
    )
  }
}
