// app/api/expenses/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { expenseSchema } from '../../../lib/validations'

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany({
      include: {
        product: true,
      },
      orderBy: {
        date: 'desc',
      },
    })
    return NextResponse.json(expenses)
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la récupération des dépenses' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const validated = expenseSchema.parse(body)
    
    const expense = await prisma.expense.create({
      data: {
        amount: validated.amount,
        category: validated.category,
        description: validated.description,
        date: new Date(validated.date),
        productId: validated.productId || null,
        invoiceUrl: validated.invoiceUrl || null,
      },
    })
    
    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la création de la dépense' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID manquant' }, { status: 400 })
    }
    
    await prisma.expense.delete({
      where: { id },
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Erreur lors de la suppression de la dépense' }, { status: 500 })
  }
}