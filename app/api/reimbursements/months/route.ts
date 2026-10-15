import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reimbursements/months - Get list of months with summary
export async function GET(request: NextRequest) {
  try {
    // Get all reimbursements with transaction dates
    const reimbursements = await prisma.reimbursement.findMany({
      include: {
        transaction: {
          select: {
            date: true,
            expense: true
          }
        }
      }
    })

    // Group by month-year
    const monthsMap = new Map<string, {
      month: string
      label: string
      year: number
      monthNumber: number
      total: number
      count: number
      pending: number
      paid: number
    }>()

    const monthNames = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]

    reimbursements.forEach(reimb => {
      const date = new Date(reimb.transaction.date)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const key = `${year}-${month.toString().padStart(2, '0')}`
      
      if (!monthsMap.has(key)) {
        monthsMap.set(key, {
          month: key,
          label: `${monthNames[month - 1]} ${year}`,
          year,
          monthNumber: month,
          total: 0,
          count: 0,
          pending: 0,
          paid: 0
        })
      }

      const summary = monthsMap.get(key)!
      summary.total += reimb.transaction.expense
      summary.count += 1
      
      if (reimb.status === 'pending') {
        summary.pending += 1
      } else if (reimb.status === 'paid') {
        summary.paid += 1
      }
    })

    // Convert map to array and sort by year-month descending
    const months = Array.from(monthsMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year
        return b.monthNumber - a.monthNumber
      })

    return NextResponse.json(months)
  } catch (error) {
    console.error('Error fetching months summary:', error)
    return NextResponse.json(
      { error: 'Failed to fetch months summary' },
      { status: 500 }
    )
  }
}
