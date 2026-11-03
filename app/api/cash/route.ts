import { NextResponse } from 'next/server'
import { calculateAccountBalances } from '@/lib/accounts'

// GET /api/cash - Calculate current cash on hand, total savings, and total wealth
export async function GET() {
  try {
    const summary = await calculateAccountBalances()

    return NextResponse.json({
      cashOnHand: summary.cashOnHand,
      totalSavings: summary.totalSavings,
      totalWealth: summary.totalWealth,
      locationBalances: summary.locationBalances,
    })
  } catch (error) {
    console.error('Error calculating cash and account balances:', error)
    return NextResponse.json(
      { error: 'Failed to calculate cash and account balances' },
      { status: 500 }
    )
  }
}
