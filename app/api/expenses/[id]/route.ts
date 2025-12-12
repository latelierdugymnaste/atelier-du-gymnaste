import { NextResponse } from 'next/server'
import { prisma } from '../../../../lib/prisma'
import { expenseSchema } from '../../../../lib/validations'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const expense = await prisma.expense.findUnique({
      where: { id: params.id },
      include: {
        product: true,
      },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Depense non trouvee' }, { status: 404 })
    }

    return NextResponse.json(expense)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la recuperation de la depense' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const validated = expenseSchema.parse(body)

    const expense = await prisma.expense.update({
      where: { id: params.id },
      data: {
        amount: validated.amount,
        category: validated.category,
        description: validated.description,
        date: new Date(validated.date),
        productId: validated.productId || null,
        invoiceUrl: validated.invoiceUrl || null,
      },
      include: {
        product: true,
      },
    })

    return NextResponse.json(expense)
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Depense non trouvee' }, { status: 404 })
    }
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la mise a jour de la depense' }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    await prisma.expense.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Depense non trouvee' }, { status: 404 })
    }
    return NextResponse.json({ error: 'Erreur lors de la suppression de la depense' }, { status: 500 })
  }
}
