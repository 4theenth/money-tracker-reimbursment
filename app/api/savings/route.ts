import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { calculateAccountBalances } from '@/lib/accounts'

// GET /api/savings - Get savings summary and details
export async function GET() {
  try {
    const summary = await calculateAccountBalances()

    // Get all transactions that involve savings categories or bank accounts
    const savingsTransactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { isSaving: true },
          { savingsLocation: { not: 'Tunai / Dompet' } },
        ],
      },
      include: { category: true },
      orderBy: { date: 'desc' },
    })

    const count = savingsTransactions.length
    const average = count > 0 ? summary.totalSavings / count : 0

    // Group by month
    const byMonth = savingsTransactions.reduce((acc, t) => {
      const date = new Date(t.date)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!acc[key]) {
        acc[key] = {
          month: key,
          total: 0,
          count: 0,
        }
      }
      acc[key].total += t.expense || t.income || 0
      acc[key].count += 1
      return acc
    }, {} as Record<string, { month: string; total: number; count: number }>)

    type MonthlyItem = { month: string; total: number; count: number }
    const monthlyData = (Object.values(byMonth) as MonthlyItem[]).sort((a, b) => 
      b.month.localeCompare(a.month)
    )

    return NextResponse.json({
      summary: {
        total: summary.totalSavings,
        count,
        average,
      },
      transactions: savingsTransactions,
      monthlyData,
    })
  } catch (error) {
    console.error('Error fetching savings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch savings data' },
      { status: 500 }
    )
  }
}
