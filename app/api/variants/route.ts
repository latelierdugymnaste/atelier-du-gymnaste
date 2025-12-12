// app/api/variants/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { variantSchema } from '../../../lib/validations'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = variantSchema.parse(body)

    const variant = await prisma.productVariant.create({
      data: {
        productId: validated.productId,
        size: validated.size,
        sellingPrice: validated.sellingPrice,
        costPrice: validated.costPrice,
        stock: validated.stock,
        minStock: validated.minStock,
      },
    })

    return NextResponse.json(variant, { status: 201 })
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Cette variante existe déjà' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur lors de la création de la variante' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    const variant = await prisma.productVariant.update({
      where: { id },
      data: {
        size: data.size,
        sellingPrice: data.sellingPrice,
        costPrice: data.costPrice,
        stock: data.stock,
        minStock: data.minStock,
      },
    })

    return NextResponse.json(variant)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la variante' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }
    
    await prisma.productVariant.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression de la variante' }, { status: 500 })
  }
}