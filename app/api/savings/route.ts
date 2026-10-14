import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/savings - Get savings summary and details (SIMPLIFIED)
export async function GET() {
  try {
    // Get all savings transactions (only "Tabungan")
    const savingsTransactions = await prisma.transaction.findMany({
      where: { isSaving: true },
      include: { category: true },
      orderBy: { date: 'desc' },
    })

    // Calculate summary (simple: sum expense)
    const totalSavings = savingsTransactions.reduce((sum, t) => sum + t.expense, 0)
    const count = savingsTransactions.length
    const average = count > 0 ? totalSavings / count : 0

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
      acc[key].total += t.expense
      acc[key].count += 1
      return acc
    }, {} as Record<string, { month: string; total: number; count: number }>)

    const monthlyData = Object.values(byMonth).sort((a, b) => 
      b.month.localeCompare(a.month)
    )

    return NextResponse.json({
      summary: {
        total: totalSavings,
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
