import { NextResponse } from 'next/server'
import { calculateAccountBalances } from '@/lib/accounts'

// GET /api/savings/breakdown - Get savings breakdown by location
export async function GET() {
  try {
    const summary = await calculateAccountBalances()

    return NextResponse.json({
      total: summary.totalSavings,
      breakdown: summary.breakdown,
    })
  } catch (error) {
    console.error('Error fetching savings breakdown:', error)
    return NextResponse.json(
      { error: 'Failed to fetch savings breakdown' },
      { status: 500 }
    )
  }
}
