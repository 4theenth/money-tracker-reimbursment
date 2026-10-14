import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PUT /api/categories/[id] - Update category
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const { name, type, icon, color, isActive } = body

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

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check duplicate name (exclude current category)
    const duplicate = await prisma.category.findFirst({
      where: {
        name,
        type,
        id: { not: id },
      },
    })

    if (duplicate) {
      return NextResponse.json(
        { error: `Kategori "${name}" sudah ada untuk tipe ${type}` },
        { status: 409 }
      )
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        name,
        type,
        icon,
        color,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating category:', error)
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 500 }
    )
  }
}

// DELETE /api/categories/[id] - Soft delete (set inactive)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)

    // Check if category exists
    const existing = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { transactions: true },
        },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Check if category is used in transactions
    if (existing._count.transactions > 0) {
      return NextResponse.json(
        { 
          error: `Kategori ini digunakan oleh ${existing._count.transactions} transaksi. Kategori akan dinonaktifkan.`,
          transactionCount: existing._count.transactions 
        },
        { status: 400 }
      )
    }

    // Soft delete: set isActive to false
    const category = await prisma.category.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json({
      message: 'Category deactivated successfully',
      category,
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
