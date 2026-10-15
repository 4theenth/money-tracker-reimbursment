import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// PATCH /api/reimbursements/:id/status - Update status reimbursement
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const { status } = body

    // Validate status
    if (!['pending', 'paid'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be "pending" or "paid"' },
        { status: 400 }
      )
    }

    // Update reimbursement status
    const reimbursement = await prisma.reimbursement.update({
      where: { id },
      data: {
        status,
        paidDate: status === 'paid' ? new Date() : null
      },
      include: {
        transaction: {
          include: {
            category: true
          }
        },
        officeCategory: true
      }
    })

    return NextResponse.json({
      success: true,
      data: reimbursement
    })
  } catch (error) {
    console.error('Error updating reimbursement status:', error)
    return NextResponse.json(
      { error: 'Failed to update status' },
      { status: 500 }
    )
  }
}
