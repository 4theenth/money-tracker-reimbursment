import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// GET /api/transactions - List all transactions with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const categoryId = searchParams.get('categoryId')
    const type = searchParams.get('type') // 'income' or 'expense'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    // Build where clause
    const where: any = {}

    if (categoryId) {
      where.categoryId = parseInt(categoryId)
    }

    if (type === 'income') {
      where.income = { gt: 0 }
    } else if (type === 'expense') {
      where.expense = { gt: 0 }
    }

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (search) {
      where.description = {
        contains: search,
      }
    }

    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        date: 'desc',
      },
    })

    // Calculate balance for each transaction
    let runningBalance = 0
    const transactionsWithBalance = transactions.reverse().map(t => {
      runningBalance += (t.income - t.expense)
      return {
        ...t,
        calculatedBalance: runningBalance,
      }
    }).reverse()

    return NextResponse.json(transactionsWithBalance)
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}

// POST /api/transactions - Create new transaction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { date, categoryId, description, income, expense, savingsLocation } = body

    // Validation
    if (!date || !categoryId || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if ((income || 0) === 0 && (expense || 0) === 0) {
      return NextResponse.json(
        { error: 'Either income or expense must be greater than 0' },
        { status: 400 }
      )
    }

    if ((income || 0) > 0 && (expense || 0) > 0) {
      return NextResponse.json(
        { error: 'Cannot have both income and expense in same transaction' },
        { status: 400 }
      )
    }

    // Get category to check if it's savings
    const category = await prisma.category.findUnique({
      where: { id: parseInt(categoryId) }
    })

    // Auto-set isSaving if category is "Tabungan" or savings-related
    const isTabungan = category?.name === 'Tabungan' || 
                       category?.name === 'Penarikan Tabungan' ||
                       category?.name === 'Bunga Tabungan'

    // Get previous balance
    const lastTransaction = await prisma.transaction.findFirst({
      where: {
        date: { lte: new Date(date) }
      },
      orderBy: { date: 'desc' }
    })

    const previousBalance = lastTransaction?.balance || 0
    const newBalance = previousBalance + (income || 0) - (expense || 0)

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        date: new Date(date),
        categoryId: parseInt(categoryId),
        description,
        income: income || 0,
        expense: expense || 0,
        balance: newBalance,
        isSaving: isTabungan,
        savingsLocation: isTabungan ? savingsLocation : null,
      },
      include: {
        category: true,
      },
    })

    // Recalculate balances for transactions after this one
    await recalculateBalances(transaction.id)

    return NextResponse.json(transaction, { status: 201 })
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

// Helper function to recalculate balances
async function recalculateBalances(fromTransactionId: number) {
  const transactions = await prisma.transaction.findMany({
    orderBy: { date: 'asc' },
  })

  let balance = 0
  for (const transaction of transactions) {
    balance = balance + transaction.income - transaction.expense
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: { balance },
    })
  }
}
