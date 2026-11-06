import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { categoryNameError, normalizeCategoryName } from '@/lib/category-name'

type Context = { params: Promise<{ id: string }> }

// PUT /api/reimbursement-categories/[id] - Update or reactivate a category
export async function PUT(request: Request, context: Context) {
  try {
    const params = await context.params
    const id = parseInt(params.id)
    const body = await request.json()
    const { icon, isActive } = body
    const name = normalizeCategoryName(body.name)

    const nameError = categoryNameError(name)
    if (nameError) {
      return NextResponse.json({ error: nameError }, { status: 400 })
    }

    const existing = await prisma.reimbursementCategory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 })
    }

    const duplicate = await prisma.reimbursementCategory.findFirst({
      where: { name, id: { not: id } },
    })
    if (duplicate) {
      return NextResponse.json({ error: `Kategori "${name}" sudah ada` }, { status: 409 })
    }

    const category = await prisma.reimbursementCategory.update({
      where: { id },
      data: {
        name,
        icon,
        isActive: isActive !== undefined ? isActive : existing.isActive,
      },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error updating reimbursement category:', error)
    return NextResponse.json({ error: 'Gagal mengubah kategori' }, { status: 500 })
  }
}

// DELETE /api/reimbursement-categories/[id] - Soft delete, so past claims keep their category
export async function DELETE(_request: Request, context: Context) {
  try {
    const params = await context.params
    const id = parseInt(params.id)

    const existing = await prisma.reimbursementCategory.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 })
    }

    const category = await prisma.reimbursementCategory.update({
      where: { id },
      data: { isActive: false },
    })

    return NextResponse.json(category)
  } catch (error) {
    console.error('Error deactivating reimbursement category:', error)
    return NextResponse.json({ error: 'Gagal menonaktifkan kategori' }, { status: 500 })
  }
}
