import { NextRequest, NextResponse } from 'next/server'
import { getBudgetPlanningData, saveBudgetPlanning } from '@/lib/budget'

// GET /api/budget?month=MM&year=YYYY
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const now = new Date()
    const month = parseInt(searchParams.get('month') || String(now.getMonth() + 1))
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()))

    if (isNaN(month) || isNaN(year) || month < 1 || month > 12) {
      return NextResponse.json(
        { error: 'Parameter month (1-12) dan year yang valid wajib disertakan' },
        { status: 400 }
      )
    }

    const data = await getBudgetPlanningData(month, year)
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error fetching budget planning data:', error)
    return NextResponse.json(
      { error: 'Gagal memuat data anggaran', details: error.message },
      { status: 500 }
    )
  }
}

// POST /api/budget - Save or update budget targets
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { month, year, targetIncome, items } = body

    if (!month || !year) {
      return NextResponse.json(
        { error: 'Bulan dan tahun wajib disertakan' },
        { status: 400 }
      )
    }

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Daftar alokasi anggaran (items) harus berupa array' },
        { status: 400 }
      )
    }

    const saved = await saveBudgetPlanning(
      parseInt(month),
      parseInt(year),
      parseFloat(targetIncome) || 0,
      items.map((it: any) => ({
        categoryId: parseInt(it.categoryId),
        targetAmount: parseFloat(it.targetAmount) || 0,
      }))
    )

    return NextResponse.json({
      success: true,
      message: `Anggaran periode ${month}/${year} berhasil disimpan`,
      data: saved,
    })
  } catch (error: any) {
    console.error('Error saving budget planning:', error)
    return NextResponse.json(
      { error: 'Gagal menyimpan anggaran', details: error.message },
      { status: 500 }
    )
  }
}
