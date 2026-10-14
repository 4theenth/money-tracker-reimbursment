import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reimbursement-categories - Get all reimbursement categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const categories = await prisma.reimbursementCategory.findMany({
      where: includeInactive ? {} : { isActive: true },
      orderBy: { name: 'asc' },
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching reimbursement categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/reimbursement-categories - Create new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, icon } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      )
    }

    // Check duplicate
    const existing = await prisma.reimbursementCategory.findFirst({
      where: { name },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Category with this name already exists' },
        { status: 400 }
      )
    }

    const category = await prisma.reimbursementCategory.create({
      data: { name, icon },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating reimbursement category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
