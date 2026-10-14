import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/categories - Get all categories
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('includeInactive') === 'true'

    const categories = await prisma.category.findMany({
      where: includeInactive ? undefined : { isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    })

    return NextResponse.json(categories)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create new category
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, type, icon, color } = body

    // Validation
    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      )
    }

    if (!['income', 'expense'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be either "income" or "expense"' },
        { status: 400 }
      )
    }

    // Check duplicate name
    const existing = await prisma.category.findFirst({
      where: { name, type },
    })

    if (existing) {
      return NextResponse.json(
        { error: `Kategori "${name}" sudah ada untuk tipe ${type}` },
        { status: 409 }
      )
    }

    const category = await prisma.category.create({
      data: {
        name,
        type,
        icon: icon || '📦',
        color: color || '#6b7280',
        isActive: true,
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
