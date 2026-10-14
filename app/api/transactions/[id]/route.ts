import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/transactions/[id] - Get single transaction
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: parseInt(params.id) },
      include: { category: true },
    })

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}

// PUT /api/transactions/[id] - Update transaction
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { date, categoryId, description, income, expense, isSaving } = body

    const transaction = await prisma.transaction.update({
      where: { id: parseInt(params.id) },
      data: {
        date: date ? new Date(date) : undefined,
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        description,
        income: income !== undefined ? income : undefined,
        expense: expense !== undefined ? expense : undefined,
        isSaving,
      },
      include: { category: true },
    })

    // Recalculate all balances
    await recalculateBalances()

    return NextResponse.json(transaction)
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to update transaction' },
      { status: 500 }
    )
  }
}

// DELETE /api/transactions/[id] - Delete transaction
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.transaction.delete({
      where: { id: parseInt(params.id) },
    })

    // Recalculate all balances
    await recalculateBalances()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}

// Helper function to recalculate all balances
async function recalculateBalances() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: 'asc' },
  })

  let balance = 0
  for (const transaction of transactions) {
    balance = balance + transaction.income - transaction.expense
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { balance },
    })
  }
}
