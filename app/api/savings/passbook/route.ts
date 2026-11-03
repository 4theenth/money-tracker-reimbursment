import { NextRequest, NextResponse } from 'next/server'
import { getPassbookData } from '@/lib/passbook'

// GET /api/savings/passbook - Get passbook data
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const month = searchParams.get('month')
    const year = searchParams.get('year')
    const location = searchParams.get('location') || 'all'

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Month and year required' },
        { status: 400 }
      )
    }

    const data = await getPassbookData(parseInt(month), parseInt(year), location)
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching passbook:', error)
    return NextResponse.json(
      { error: 'Failed to fetch passbook data' },
      { status: 500 }
    )
  }
}
