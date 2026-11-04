import { prisma } from '@/lib/prisma'

export interface BudgetItemDetail {
  id?: number
  categoryId: number
  categoryName: string
  categoryIcon: string | null
  categoryColor: string | null
  targetAmount: number
  actualAmount: number
  difference: number // targetAmount - actualAmount (positive = remaining, negative = overbudget)
  percentage: number // (actualAmount / targetAmount) * 100
  status: 'OK' | 'ALERT' | 'OVER'
}

export interface BudgetSummary {
  period: {
    id?: number
    month: number
    year: number
    monthName: string
    label: string
    isConfigured: boolean
  }
  targetIncome: number
  actualIncome: number
  incomeDifference: number
  totalTargetExpense: number
  totalActualExpense: number
  totalExpenseDifference: number // Sisa kuota belanja
  totalExpensePercentage: number
  unallocatedBudget: number // targetIncome - totalTargetExpense
  statusCounts: {
    ok: number
    alert: number
    over: number
    total: number
  }
  items: BudgetItemDetail[]
  allExpenseCategories: Array<{
    id: number
    name: string
    icon: string | null
    color: string | null
  }>
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

/**
 * Get comprehensive budget planning data for a specific month and year
 */
export async function getBudgetPlanningData(
  month: number,
  year: number
): Promise<BudgetSummary> {
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0)
  const endDate = new Date(year, month, 0, 23, 59, 59, 999)

  const monthName = MONTH_NAMES[month - 1] || `Bulan ${month}`
  const label = `${monthName} ${year}`

  // 1. Fetch budget period with items
  const budgetPeriod = await prisma.budgetPeriod.findUnique({
    where: {
      month_year: {
        month,
        year,
      },
    },
    include: {
      items: {
        include: {
          category: true,
        },
      },
    },
  })

  // 2. Fetch all active expense categories
  const expenseCategories = await prisma.category.findMany({
    where: {
      type: 'expense',
      isActive: true,
    },
    orderBy: {
      id: 'asc',
    },
  })

  // 3. Fetch all transactions in this period
  const transactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      category: true,
    },
  })

  // 4. Calculate actual expenses per category & total income
  let actualIncome = 0
  const actualExpenseMap = new Map<number, number>()

  for (const t of transactions) {
    if (t.income > 0) {
      actualIncome += t.income
    }
    if (t.expense > 0) {
      const current = actualExpenseMap.get(t.categoryId) || 0
      actualExpenseMap.set(t.categoryId, current + t.expense)
    }
  }

  // 5. Build budget items details
  const targetMap = new Map<number, { id: number; targetAmount: number }>()
  if (budgetPeriod?.items) {
    for (const item of budgetPeriod.items) {
      targetMap.set(item.categoryId, {
        id: item.id,
        targetAmount: item.targetAmount,
      })
    }
  }

  // Build unified list of candidate categories
  const categoryMap = new Map<number, { id: number; name: string; icon: string | null; color: string | null }>()
  for (const cat of expenseCategories) {
    categoryMap.set(cat.id, cat)
  }
  // Include categories from budgetPeriod items (even if deactivated)
  if (budgetPeriod?.items) {
    for (const item of budgetPeriod.items) {
      if (item.category && !categoryMap.has(item.categoryId)) {
        categoryMap.set(item.categoryId, item.category)
      }
    }
  }
  // Include categories from transactions (even if deactivated)
  for (const t of transactions) {
    if (t.category && t.expense > 0 && !categoryMap.has(t.categoryId)) {
      categoryMap.set(t.categoryId, t.category)
    }
  }

  let totalTargetExpense = 0
  let totalActualExpense = 0
  let okCount = 0
  let alertCount = 0
  let overCount = 0

  const items: BudgetItemDetail[] = []

  for (const [catId, cat] of categoryMap.entries()) {
    const targetInfo = targetMap.get(catId)
    const hasTarget = targetInfo !== undefined
    const targetAmount = targetInfo?.targetAmount || 0
    const actualAmount = actualExpenseMap.get(catId) || 0

    // If budgetPeriod is configured, only include if hasTarget or actualAmount > 0
    if (budgetPeriod && !hasTarget && actualAmount === 0) {
      continue
    }

    const difference = targetAmount - actualAmount

    let percentage = 0
    if (targetAmount > 0) {
      percentage = Math.round((actualAmount / targetAmount) * 1000) / 10 // 1 decimal point
    } else if (actualAmount > 0) {
      percentage = 100 // Unbudgeted spending
    }

    // Status logic matching Excel: >100% OVER, >80% ALERT, else OK
    let status: 'OK' | 'ALERT' | 'OVER' = 'OK'
    if (targetAmount > 0) {
      if (percentage > 100) {
        status = 'OVER'
        overCount++
      } else if (percentage >= 80) {
        status = 'ALERT'
        alertCount++
      } else {
        status = 'OK'
        okCount++
      }
    } else {
      if (actualAmount > 0) {
        status = 'OVER' // Spent without target
        overCount++
      } else {
        status = 'OK'
        okCount++
      }
    }

    totalTargetExpense += targetAmount
    totalActualExpense += actualAmount

    items.push({
      id: targetInfo?.id,
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      categoryColor: cat.color,
      targetAmount,
      actualAmount,
      difference,
      percentage,
      status,
    })
  }

  // Sort items: Items with target > 0 or actual > 0 first, then by targetAmount descending
  items.sort((a, b) => {
    const aActive = a.targetAmount > 0 || a.actualAmount > 0 ? 1 : 0
    const bActive = b.targetAmount > 0 || b.actualAmount > 0 ? 1 : 0
    if (aActive !== bActive) return bActive - aActive
    return b.targetAmount - a.targetAmount
  })

  const targetIncome = budgetPeriod?.targetIncome || 0
  const incomeDifference = actualIncome - targetIncome
  const totalExpenseDifference = totalTargetExpense - totalActualExpense
  const totalExpensePercentage = totalTargetExpense > 0 
    ? Math.round((totalActualExpense / totalTargetExpense) * 1000) / 10 
    : 0
  const unallocatedBudget = targetIncome - totalTargetExpense

  return {
    period: {
      id: budgetPeriod?.id,
      month,
      year,
      monthName,
      label,
      isConfigured: !!budgetPeriod,
    },
    targetIncome,
    actualIncome,
    incomeDifference,
    totalTargetExpense,
    totalActualExpense,
    totalExpenseDifference,
    totalExpensePercentage,
    unallocatedBudget,
    statusCounts: {
      ok: okCount,
      alert: alertCount,
      over: overCount,
      total: items.length,
    },
    items,
    allExpenseCategories: expenseCategories.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
      color: c.color,
    })),
  }
}

/**
 * Save or update budget planning target for a period
 */
export async function saveBudgetPlanning(
  month: number,
  year: number,
  targetIncome: number,
  items: Array<{ categoryId: number; targetAmount: number }>
): Promise<BudgetSummary> {
  // 1. Upsert BudgetPeriod
  const period = await prisma.budgetPeriod.upsert({
    where: {
      month_year: {
        month,
        year,
      },
    },
    update: {
      targetIncome: targetIncome || 0,
    },
    create: {
      month,
      year,
      targetIncome: targetIncome || 0,
    },
  })

  // 2. Delete any BudgetItem for this period that is no longer in items
  const validCategoryIds = items.map((it) => it.categoryId).filter(Boolean)
  await prisma.budgetItem.deleteMany({
    where: {
      budgetPeriodId: period.id,
      categoryId: {
        notIn: validCategoryIds,
      },
    },
  })

  // 3. Upsert each remaining BudgetItem
  for (const item of items) {
    if (item.categoryId) {
      await prisma.budgetItem.upsert({
        where: {
          budgetPeriodId_categoryId: {
            budgetPeriodId: period.id,
            categoryId: item.categoryId,
          },
        },
        update: {
          targetAmount: item.targetAmount || 0,
        },
        create: {
          budgetPeriodId: period.id,
          categoryId: item.categoryId,
          targetAmount: item.targetAmount || 0,
        },
      })
    }
  }

  // 4. Return freshly calculated data
  return getBudgetPlanningData(month, year)
}

/**
 * Copy budget targets from another month/year
 */
export async function copyBudgetFromPrevious(
  targetMonth: number,
  targetYear: number,
  sourceMonth?: number,
  sourceYear?: number
): Promise<BudgetSummary> {
  // Resolve source month/year if not provided (default: 1 month earlier)
  let sMonth = sourceMonth
  let sYear = sourceYear

  if (!sMonth || !sYear) {
    if (targetMonth === 1) {
      sMonth = 12
      sYear = targetYear - 1
    } else {
      sMonth = targetMonth - 1
      sYear = targetYear
    }
  }

  // Find source budget period
  const sourcePeriod = await prisma.budgetPeriod.findUnique({
    where: {
      month_year: {
        month: sMonth,
        year: sYear,
      },
    },
    include: {
      items: true,
    },
  })

  if (!sourcePeriod) {
    throw new Error(`Data anggaran sumber untuk periode ${sMonth}/${sYear} tidak ditemukan`)
  }

  // Upsert into target period
  const itemsToSave = sourcePeriod.items.map((item) => ({
    categoryId: item.categoryId,
    targetAmount: item.targetAmount,
  }))

  return saveBudgetPlanning(targetMonth, targetYear, sourcePeriod.targetIncome, itemsToSave)
}
