// app/api/customers/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: params.id },
      include: {
        orders: {
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
            createdAt: 'desc',
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json({ error: 'Client non trouvé' }, { status: 404 })
    }

    return NextResponse.json(customer)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la récupération du client' }, { status: 500 })
  }
}
