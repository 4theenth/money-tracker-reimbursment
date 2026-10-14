import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/reimbursements - Get all reimbursements with filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const month = searchParams.get('month')
    const year = searchParams.get('year')

    const where: any = {}

    if (status) {
      where.status = status
    }

    // Filter by month/year through transaction date
    if (month || year) {
      const dateFilter: any = {}
      
      if (year) {
        const yearNum = parseInt(year)
        dateFilter.gte = new Date(yearNum, month ? parseInt(month) - 1 : 0, 1)
        dateFilter.lt = new Date(
          yearNum,
          month ? parseInt(month) : 12,
          month ? 1 : 1
        )
      }

      where.transaction = {
        date: dateFilter
      }
    }

    const reimbursements = await prisma.reimbursement.findMany({
      where,
      include: {
        transaction: {
          include: {
            category: true,
          },
        },
        officeCategory: true,
      },
      orderBy: {
        transaction: {
          date: 'desc',
        },
      },
    })

    return NextResponse.json(reimbursements)
  } catch (error) {
    console.error('Error fetching reimbursements:', error)
    return NextResponse.json(
      { error: 'Failed to fetch reimbursements' },
      { status: 500 }
    )
  }
}

// POST /api/reimbursements - Create new reimbursement with auto-transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, officeCategoryId, description, amount, notes, receiptPhoto } = body

    // Validate required fields
    if (!date || !officeCategoryId || !description || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields: date, officeCategoryId, description, amount' },
        { status: 400 }
      )
    }

    // Find "Reimbursement Kantor" category
    const reimbursementCategory = await prisma.category.findFirst({
      where: {
        name: 'Reimbursement Kantor',
        type: 'expense'
      }
    })

    if (!reimbursementCategory) {
      return NextResponse.json(
        { error: 'Kategori "Reimbursement Kantor" tidak ditemukan. Jalankan seed database.' },
        { status: 404 }
      )
    }

    // Create transaction + reimbursement in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create transaction
      const transaction = await tx.transaction.create({
        data: {
          date: new Date(date),
          categoryId: reimbursementCategory.id,
          description,
          expense: parseFloat(amount),
          income: 0,
          isSaving: false
        }
      })

      // 2. Create reimbursement linked to transaction
      const reimbursement = await tx.reimbursement.create({
        data: {
          transactionId: transaction.id,
          officeCategoryId: parseInt(officeCategoryId),
          receiptPhoto: receiptPhoto || null,
          notes: notes || null,
          status: 'pending'
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

      return reimbursement
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error creating reimbursement:', error)
    return NextResponse.json(
      { error: 'Failed to create reimbursement' },
      { status: 500 }
    )
  }
}
