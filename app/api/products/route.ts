// app/api/products/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { productSchema } from '../../../lib/validations'

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        variants: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })
    return NextResponse.json(products)
  } catch (error) {
    console.error('Error fetching products:', error)
    return NextResponse.json({ error: 'Erreur lors de la récupération des produits' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = productSchema.parse(body)

    // Créer le produit avec ses variantes si présentes
    const product = await prisma.product.create({
      data: {
        name: validated.name,
        category: validated.category,
        sku: validated.sku,
        isActive: validated.isActive,
        variants: body.variants ? {
          create: body.variants.map((v: any) => ({
            size: v.size,
            sellingPrice: v.sellingPrice,
            costPrice: v.costPrice || 0,
            stock: v.stock || 0,
            minStock: v.minStock || 0,
          }))
        } : undefined,
      },
      include: {
        variants: true,
      },
    })

    return NextResponse.json(product, { status: 201 })
  } catch (error: any) {
    console.error('Error creating product:', error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Ce SKU existe déjà' }, { status: 400 })
    }
    if (error.name === 'ZodError') {
      return NextResponse.json({ error: 'Données invalides: ' + error.errors[0].message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erreur lors de la création du produit' }, { status: 500 })
  }
}