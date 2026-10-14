import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/savings/breakdown - Get savings breakdown by location (SIMPLIFIED)
export async function GET() {
  try {
    // Get all savings transactions (only "Tabungan" category)
    const transactions = await prisma.transaction.findMany({
      where: {
        isSaving: true,
      },
      include: { category: true },
      orderBy: { date: 'asc' },
    })

    // Calculate balance per location
    const locationBalances: Record<string, {
      balance: number
      transactions: number
      lastTransaction: Date | null
    }> = {}

    transactions.forEach(t => {
      const location = t.savingsLocation || 'Tidak Ditentukan'
      
      if (!locationBalances[location]) {
        locationBalances[location] = {
          balance: 0,
          transactions: 0,
          lastTransaction: null
        }
      }

      // Simple: just add expense (nabung)
      locationBalances[location].balance += t.expense
      locationBalances[location].transactions += 1
      locationBalances[location].lastTransaction = new Date(t.date)
    })

    // Convert to array and sort by balance
    const breakdown = Object.entries(locationBalances)
      .map(([location, data]) => ({
        location,
        balance: data.balance,
        transactions: data.transactions,
        lastTransaction: data.lastTransaction,
      }))
      .filter(item => item.balance > 0) // Only show locations with positive balance
      .sort((a, b) => b.balance - a.balance)

    // Calculate totals
    const totalBalance = breakdown.reduce((sum, item) => sum + item.balance, 0)

    return NextResponse.json({
      total: totalBalance,
      breakdown,
    })
  } catch (error) {
    console.error('Error fetching savings breakdown:', error)
    return NextResponse.json(
      { error: 'Failed to fetch savings breakdown' },
      { status: 500 }
    )
  }
}
