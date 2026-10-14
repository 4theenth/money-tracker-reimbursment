import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/cash - Calculate current cash on hand (SIMPLIFIED)
export async function GET() {
  try {
    // Get all transactions
    const transactions = await prisma.transaction.findMany({
      include: { category: true },
      orderBy: { date: 'asc' },
    })

    let cashOnHand = 0

    transactions.forEach(t => {
      // Only count NON-savings transactions for cash
      if (!t.isSaving) {
        // Normal income/expense
        cashOnHand += t.income
        cashOnHand -= t.expense
      }
    })

    // Calculate total in all savings (SIMPLE: just sum of Tabungan)
    const savingsTransactions = await prisma.transaction.findMany({
      where: { 
        isSaving: true,
      },
      include: { category: true },
    })

    // Total savings = sum of all "Tabungan" expense
    const totalSavings = savingsTransactions.reduce((sum, t) => {
      return sum + t.expense
    }, 0)

    // Total wealth = Cash + Savings
    const totalWealth = cashOnHand + totalSavings

    return NextResponse.json({
      cashOnHand,
      totalSavings,
      totalWealth,
    })
  } catch (error) {
    console.error('Error calculating cash:', error)
    return NextResponse.json(
      { error: 'Failed to calculate cash' },
      { status: 500 }
    )
  }
}
