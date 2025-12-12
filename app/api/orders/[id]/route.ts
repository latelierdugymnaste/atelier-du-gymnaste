import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const order = await prisma.order.findUnique({
      where: { id: params.id },
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
    })

    if (!order) {
      return NextResponse.json({ error: 'Commande non trouvee' }, { status: 404 })
    }

    return NextResponse.json(order)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la recuperation de la commande' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()

    const updateData: any = {}

    if (body.customerId !== undefined) {
      updateData.customerId = body.customerId || null
    }
    if (body.status !== undefined) {
      updateData.status = body.status
    }
    if (body.customerName !== undefined) {
      updateData.customerName = body.customerName
    }
    if (body.customerEmail !== undefined) {
      updateData.customerEmail = body.customerEmail || null
    }
    if (body.customerPhone !== undefined) {
      updateData.customerPhone = body.customerPhone || null
    }
    if (body.customerAddress !== undefined) {
      updateData.customerAddress = body.customerAddress || null
    }
    if (body.salesChannel !== undefined) {
      updateData.salesChannel = body.salesChannel
    }
    if (body.date !== undefined) {
      updateData.date = new Date(body.date)
    }
    if (body.tags !== undefined) {
      updateData.tags = body.tags || null
    }
    if (body.paymentMethod !== undefined) {
      updateData.paymentMethod = body.paymentMethod || null
    }

    // Si des items sont fournis, on supprime les anciens et on crée les nouveaux
    if (body.items !== undefined) {
      const totalAmount = body.items.reduce(
        (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
        0
      )
      updateData.totalAmount = totalAmount

      // Supprimer les anciens items et créer les nouveaux
      await prisma.orderItem.deleteMany({
        where: { orderId: params.id },
      })

      const order = await prisma.order.update({
        where: { id: params.id },
        data: {
          ...updateData,
          items: {
            create: body.items.map((item: any) => ({
              productVariantId: item.productVariantId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              costPriceAtSale: item.costPriceAtSale,
              lineTotal: item.quantity * item.unitPrice,
            })),
          },
        },
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
      })

      return NextResponse.json(order)
    } else {
      // Mise à jour simple sans modification des items
      const order = await prisma.order.update({
        where: { id: params.id },
        data: updateData,
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
      })

      return NextResponse.json(order)
    }
  } catch (error: any) {
    console.error(error)
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Commande non trouvee' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur lors de la mise a jour de la commande' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.order.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Commande non trouvee' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur lors de la suppression de la commande' }, { status: 500 })
  }
}
