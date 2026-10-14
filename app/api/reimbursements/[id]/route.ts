import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

type Params = {
  params: {
    id: string
  }
}

// GET /api/reimbursements/[id] - Get single reimbursement
export async function GET(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id)

    const reimbursement = await prisma.reimbursement.findUnique({
      where: { id },
      include: {
        transaction: {
          include: {
            category: true,
          },
        },
        officeCategory: true,
      },
    })

    if (!reimbursement) {
      return NextResponse.json(
        { error: 'Reimbursement not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(reimbursement)
  } catch (error) {
    console.error('Error fetching reimbursement:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reimbursement' },
      { status: 500 }
    )
  }
}

// PUT /api/reimbursements/[id] - Update reimbursement
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const { officeCategoryId, receiptPhoto, notes, status } = body

    const data: any = {}

    if (officeCategoryId !== undefined) data.officeCategoryId = officeCategoryId
    if (receiptPhoto !== undefined) data.receiptPhoto = receiptPhoto
    if (notes !== undefined) data.notes = notes
    if (status !== undefined) {
      data.status = status
      if (status === 'claimed') {
        data.claimedAt = new Date()
      }
    }

    const reimbursement = await prisma.reimbursement.update({
      where: { id },
      data,
      include: {
        transaction: {
          include: {
            category: true,
          },
        },
        officeCategory: true,
      },
    })

    return NextResponse.json(reimbursement)
  } catch (error) {
    console.error('Error updating reimbursement:', error)
    return NextResponse.json(
      { error: 'Failed to update reimbursement' },
      { status: 500 }
    )
  }
}

// DELETE /api/reimbursements/[id] - Delete reimbursement
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    const id = parseInt(params.id)

    await prisma.reimbursement.delete({
      where: { id },
    })

    return NextResponse.json({ message: 'Reimbursement deleted successfully' })
  } catch (error) {
    console.error('Error deleting reimbursement:', error)
    return NextResponse.json(
      { error: 'Failed to delete reimbursement' },
      { status: 500 }
    )
  }
}
