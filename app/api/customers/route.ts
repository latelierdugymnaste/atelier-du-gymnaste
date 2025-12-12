// app/api/customers/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')

    const customers = await prisma.customer.findMany({
      where: search ? {
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      } : undefined,
      orderBy: {
        name: 'asc',
      },
      take: 20,
    })

    return NextResponse.json(customers)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la recuperation des clients' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const customer = await prisma.customer.create({
      data: {
        name: body.name,
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
      },
    })

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la creation du client' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        address: data.address || null,
      },
    })

    return NextResponse.json(customer)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la mise a jour du client' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }

    await prisma.customer.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la suppression du client' }, { status: 500 })
  }
}
