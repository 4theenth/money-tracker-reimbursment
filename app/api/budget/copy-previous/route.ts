import { NextRequest, NextResponse } from 'next/server'
import { copyBudgetFromPrevious } from '@/lib/budget'

// POST /api/budget/copy-previous - Copy budget targets from another month/year
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { targetMonth, targetYear, sourceMonth, sourceYear } = body

    if (!targetMonth || !targetYear) {
      return NextResponse.json(
        { error: 'Bulan target (targetMonth) dan tahun target (targetYear) wajib disertakan' },
        { status: 400 }
      )
    }

    const result = await copyBudgetFromPrevious(
      parseInt(targetMonth),
      parseInt(targetYear),
      sourceMonth ? parseInt(sourceMonth) : undefined,
      sourceYear ? parseInt(sourceYear) : undefined
    )

    return NextResponse.json({
      success: true,
      message: `Anggaran berhasil disalin ke periode ${targetMonth}/${targetYear}`,
      data: result,
    })
  } catch (error: any) {
    console.error('Error copying budget planning:', error)
    return NextResponse.json(
      { error: 'Gagal menyalin anggaran', details: error.message },
      { status: 500 }
    )
  }
}
