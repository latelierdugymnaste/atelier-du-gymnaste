// app/api/expenses/[id]/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'
import { expenseSchema } from '../../../lib/validations'

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
      },
    })
    
    return NextResponse.json(expense)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Erreur lors de la mise à jour de la dépense' }, { status: 500 })
  }
}