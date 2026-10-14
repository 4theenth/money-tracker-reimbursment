import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/savings/passbook - Get passbook-style transaction list (SIMPLIFIED)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year required' },
        { status: 400 }
      )
    }

    // Get date range for the month
    const startDate = new Date(parseInt(year), parseInt(month) - 1, 1)
    const endDate = new Date(parseInt(year), parseInt(month), 0, 23, 59, 59)

    // Get all savings transactions in the period (only "Tabungan")
    const transactions = await prisma.transaction.findMany({
      where: {
        isSaving: true,
        date: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Get balance before this period
    const previousTransactions = await prisma.transaction.findMany({
      where: {
        isSaving: true,
        date: {
          lt: startDate,
        }
      },
      include: {
        category: true,
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Calculate starting balance (simple: sum all previous "Tabungan")
    let runningBalance = previousTransactions.reduce((sum, t) => sum + t.expense, 0)

    // Add running balance to current period transactions
    const transactionsWithBalance = transactions.map(t => {
      runningBalance += t.expense // Simple: just add expense (nabung)

      return {
        ...t,
        runningBalance,
      }
    })

    return NextResponse.json({
      transactions: transactionsWithBalance,
      startBalance: transactionsWithBalance.length > 0 
        ? transactionsWithBalance[0].runningBalance - transactionsWithBalance[0].expense
        : runningBalance,
      endBalance: runningBalance,
    })
  } catch (error) {
    console.error('Error fetching passbook:', error)
    return NextResponse.json(
      { error: 'Failed to fetch passbook data' },
      { status: 500 }
    )
  }
}
