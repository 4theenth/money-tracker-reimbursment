import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { deleteTransactionWithLinks, recalculateBalances } from '@/lib/reimbursements'

interface RouteContext {
  params: Promise<{ id: string }> | { id: string }
}

// GET /api/transactions/[id] - Get single transaction
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const params = await Promise.resolve(context.params)
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
  context: RouteContext
) {
  try {
    const params = await Promise.resolve(context.params)
    const body = await request.json()
    const { date, categoryId, description, income, expense, isSaving, savingsLocation } = body
    const id = parseInt(params.id)

    const existing = await prisma.transaction.findUnique({
      where: { id },
      include: { reimbursement: true, reimbursementPayment: true },
    })

    // A claim's payment always equals the claim, so only its date, account and note can change
    if (existing?.reimbursementPayment) {
      const changesAmount = income !== undefined && income !== existing.income
      const changesCategory = categoryId !== undefined && parseInt(categoryId) !== existing.categoryId
      if (changesAmount || changesCategory) {
        return NextResponse.json(
          { error: 'Jumlah dan kategori penggantian mengikuti klaim reimbursement. Ubah statusnya di halaman Reimbursement.' },
          { status: 400 }
        )
      }
    }

    const transaction = await prisma.$transaction(async (tx) => {
      const updated = await tx.transaction.update({
        where: { id },
        data: {
          date: date ? new Date(date) : undefined,
          categoryId: categoryId ? parseInt(categoryId) : undefined,
          description,
          income: income !== undefined ? income : undefined,
          expense: expense !== undefined ? expense : undefined,
          isSaving,
          savingsLocation: savingsLocation !== undefined ? savingsLocation : undefined,
        },
        include: { category: true },
      })

      if (existing?.reimbursementPayment && date) {
        await tx.reimbursement.update({
          where: { id: existing.reimbursementPayment.id },
          data: { paidDate: updated.date },
        })
      }

      if (existing?.reimbursement?.paymentTransactionId && expense !== undefined) {
        await tx.transaction.update({
          where: { id: existing.reimbursement.paymentTransactionId },
          data: { income: expense },
        })
      }

      return updated
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
  context: RouteContext
) {
  try {
    const params = await Promise.resolve(context.params)
    await deleteTransactionWithLinks(parseInt(params.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete transaction' },
      { status: 500 }
    )
  }
}
