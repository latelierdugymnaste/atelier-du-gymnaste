// app/api/orders/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { orderSchema, orderItemSchema } from '../../../lib/validations'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      include: {
        items: {
          include: {
            productVariant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    })
    return NextResponse.json(orders)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des commandes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { items, giftCardCode, giftCardDiscount, ...orderData } = body

    const validated = orderSchema.parse(orderData)
    const validatedItems = items.map((item: any) => orderItemSchema.parse(item))

    const subtotal = validatedItems.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
      0
    )

    const discount = giftCardDiscount || 0
    const totalAmount = subtotal - discount

    const order = await prisma.order.create({
      data: {
        customerId: validated.customerId || null,
        customerName: validated.customerName,
        customerEmail: validated.customerEmail || null,
        customerPhone: validated.customerPhone || null,
        customerAddress: validated.customerAddress || null,
        salesChannel: validated.salesChannel,
        date: new Date(validated.date),
        status: 'DRAFT',
        tags: validated.tags || null,
        paymentMethod: validated.paymentMethod || null,
        totalAmount,
        giftCardCode: giftCardCode || null,
        giftCardDiscount: discount,
        items: {
          create: validatedItems.map((item: any) => ({
            productVariantId: item.productVariantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            costPriceAtSale: item.costPriceAtSale,
            lineTotal: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: true,
      },
    })

    return NextResponse.json(order, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la création de la commande' }, { status: 500 })
  }
}