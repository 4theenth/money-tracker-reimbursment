import { prisma } from '@/lib/prisma'

export interface PassbookTx {
  id: number
  date: Date
  description: string
  category: {
    id: number
    name: string
    icon: string | null
    type: string
  }
  savingsLocation: string
  debit: number
  credit: number
  runningBalance: number
  isTransfer?: boolean
}

export interface PassbookResult {
  location: string
  locationTitle: string
  period: {
    month: number
    year: number
    monthName: string
    label: string
  }
  startBalance: number
  endBalance: number
  totalDebit: number
  totalCredit: number
  transactions: PassbookTx[]
}

const MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export async function getPassbookData(
  month: number,
  year: number,
  location: string = 'all'
): Promise<PassbookResult> {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59)

  const monthName = MONTH_NAMES[month - 1] || `Bulan ${month}`
  const label = `${monthName} ${year}`

  let locationTitle = 'Semua Akun (Kas Tunai & Bank)'
  if (location === 'savings') {
    locationTitle = 'Semua Rekening Bank (Non-Tunai)'
  } else if (location === 'Tunai / Dompet') {
    locationTitle = 'Kas Tunai & Dompet'
  } else if (location && location !== 'all') {
    locationTitle = location
  }

  const evaluateTxFlow = (t: any, targetLoc: string | null) => {
    const txLoc = t.savingsLocation && t.savingsLocation.trim() ? t.savingsLocation.trim() : 'Tunai / Dompet'
    const catName = t.category?.name || ''
    const isAll = !targetLoc || targetLoc === 'all'
    const isSavingsOnly = targetLoc === 'savings'
    const isCash = targetLoc === 'Tunai / Dompet'

    let debit = 0
    let credit = 0
    let relevant = false
    let isTransfer = false
    let displayDesc = t.description

    if (isAll) {
      // 1. COMBINED CASH + ALL BANK ACCOUNTS (Total Wealth Ledger)
      relevant = true
      if (catName === 'Tabungan') {
        // Internal transfer: Tunai -> Bank (No change to total wealth)
        isTransfer = true
        displayDesc = `${t.description} (Transfer: Tunai ➜ ${txLoc})`
      } else if (catName === 'Penarikan Tabungan') {
        // Internal transfer: Bank -> Tunai (No change to total wealth)
        isTransfer = true
        displayDesc = `${t.description} (Transfer: ${txLoc} ➜ Tunai)`
      } else {
        if (t.income > 0) credit = t.income
        if (t.expense > 0) debit = t.expense
      }
    } else if (isSavingsOnly) {
      // 2. ALL BANK & E-WALLET ACCOUNTS ONLY (Excluding Tunai / Dompet)
      if (catName === 'Tabungan') {
        // Deposit from cash into savings bank
        credit = t.expense
        relevant = true
      } else if (catName === 'Penarikan Tabungan') {
        // Withdrawal from savings bank to cash
        debit = t.income
        relevant = true
      } else if (txLoc !== 'Tunai / Dompet') {
        if (t.income > 0) {
          credit = t.income
          relevant = true
        }
        if (t.expense > 0) {
          debit = t.expense
          relevant = true
        }
      }
    } else if (isCash) {
      // 3. PHYSICAL CASH / WALLET ONLY
      if (catName === 'Tabungan') {
        // Cash leaves wallet to bank
        debit = t.expense
        relevant = true
      } else if (catName === 'Penarikan Tabungan') {
        // Cash enters wallet from bank
        credit = t.income
        relevant = true
      } else if (txLoc === 'Tunai / Dompet') {
        if (t.income > 0) {
          credit = t.income
          relevant = true
        }
        if (t.expense > 0) {
          debit = t.expense
          relevant = true
        }
      }
    } else {
      // 4. SPECIFIC ACCOUNT (e.g. 'Bank BCA' or 'Bank BRI')
      if (catName === 'Tabungan') {
        if (txLoc === targetLoc) {
          credit = t.expense
          relevant = true
        }
      } else if (catName === 'Penarikan Tabungan') {
        if (txLoc === targetLoc) {
          debit = t.income
          relevant = true
        }
      } else if (txLoc === targetLoc) {
        if (t.income > 0) {
          credit = t.income
          relevant = true
        }
        if (t.expense > 0) {
          debit = t.expense
          relevant = true
        }
      }
    }

    return { relevant, debit, credit, isTransfer, displayDesc }
  }

  // 1. Fetch previous transactions for start balance
  const previousTransactions = await prisma.transaction.findMany({
    where: { date: { lt: startDate } },
    include: { category: true },
    orderBy: { date: 'asc' }
  })

  let startingBalance = 0
  for (const t of previousTransactions) {
    const { relevant, debit, credit } = evaluateTxFlow(t, location)
    if (relevant) {
      startingBalance += (credit - debit)
    }
  }

  // 2. Fetch current month transactions
  const currentTransactions = await prisma.transaction.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      }
    },
    include: { category: true },
    orderBy: { date: 'asc' }
  })

  let runningBalance = startingBalance
  let totalDebit = 0
  let totalCredit = 0
  const passbookEntries: PassbookTx[] = []

  for (const t of currentTransactions) {
    const { relevant, debit, credit, isTransfer, displayDesc } = evaluateTxFlow(t, location)
    if (relevant) {
      runningBalance += (credit - debit)
      totalDebit += debit
      totalCredit += credit

      passbookEntries.push({
        id: t.id,
        date: t.date,
        description: displayDesc,
        category: {
          id: t.category.id,
          name: t.category.name,
          icon: t.category.icon,
          type: t.category.type,
        },
        savingsLocation: t.savingsLocation || 'Tunai / Dompet',
        debit,
        credit,
        runningBalance,
        isTransfer,
      })
    }
  }

  return {
    location: location || 'all',
    locationTitle,
    period: {
      month,
      year,
      monthName,
      label,
    },
    startBalance: startingBalance,
    endBalance: runningBalance,
    totalDebit,
    totalCredit,
    transactions: passbookEntries,
  }
}
