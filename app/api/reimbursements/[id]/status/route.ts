import { NextRequest, NextResponse } from 'next/server'
import { setReimbursementStatus } from '@/lib/reimbursements'

// PATCH /api/reimbursements/:id/status - Update status reimbursement
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
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

    const reimbursement = await setReimbursementStatus(id, status)

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
