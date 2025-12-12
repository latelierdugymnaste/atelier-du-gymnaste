import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { productSchema } from '../../../../lib/validations'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        variants: true,
        expenses: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Produit non trouve' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la recuperation du produit' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const validated = productSchema.parse(body)

    const product = await prisma.product.update({
      where: { id: params.id },
      data: {
        name: validated.name,
        category: validated.category,
        sku: validated.sku,
        baseSellingPrice: validated.baseSellingPrice,
        baseCostPrice: validated.baseCostPrice,
        isActive: validated.isActive,
      },
      include: {
        variants: true,
      },
    })

    return NextResponse.json(product)
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ce SKU existe deja' }, { status: 400 })
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Produit non trouve' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur lors de la mise a jour du produit' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.product.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Produit non trouve' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur lors de la suppression du produit' }, { status: 500 })
  }
}
