// app/api/products/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Paramètre de recherche manquant' }, { status: 400 })
    }

    // Rechercher les produits par nom ou SKU
    const products = await prisma.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: query,
              mode: 'insensitive'
            }
          },
          {
            sku: {
              contains: query,
              mode: 'insensitive'
            }
          }
        ]
      },
      include: {
        variants: {
          select: {
            id: true,
            size: true,
            stock: true,
            sellingPrice: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    })

    // Calculer le stock total pour chaque produit
    const productsWithStats = products.map(product => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      category: product.category,
      isActive: product.isActive,
      totalStock: product.variants.reduce((sum, v) => sum + v.stock, 0),
      variantCount: product.variants.length,
      variants: product.variants
    }))

    return NextResponse.json(productsWithStats)

  } catch (error) {
    console.error('Erreur:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
