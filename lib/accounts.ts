import { prisma } from '@/lib/prisma'

export interface AccountBalance {
  location: string
  balance: number
  transactions: number
  lastTransaction: Date | null
}

export interface BalancesSummary {
  cashOnHand: number
  totalSavings: number
  totalWealth: number
  locationBalances: Record<string, AccountBalance>
  breakdown: AccountBalance[]
}

/**
 * Calculate balances for all accounts/locations and overall cash & savings summary
 */
export async function calculateAccountBalances(): Promise<BalancesSummary> {
  // 1. Get all configured locations from settings
  let configuredLocations: string[] = ['Tunai / Dompet', 'Bank BCA', 'Bank BRI']
  try {
    const setting = await prisma.appSettings.findUnique({
      where: { key: 'savings_locations' },
    })
    if (setting) {
      const parsed = JSON.parse(setting.value)
      if (Array.isArray(parsed) && parsed.length > 0) {
        configuredLocations = parsed
      }
    }
  } catch (error) {
    console.error('Error loading savings_locations setting:', error)
  }

  // 2. Fetch all transactions with categories
  const transactions = await prisma.transaction.findMany({
    include: { category: true },
    orderBy: { date: 'asc' },
  })

  // 3. Initialize balances for all configured locations
  const locationBalances: Record<string, AccountBalance> = {}

  for (const loc of configuredLocations) {
    locationBalances[loc] = {
      location: loc,
      balance: 0,
      transactions: 0,
      lastTransaction: null,
    }
  }

  // Ensure 'Tunai / Dompet' is always present
  if (!locationBalances['Tunai / Dompet']) {
    locationBalances['Tunai / Dompet'] = {
      location: 'Tunai / Dompet',
      balance: 0,
      transactions: 0,
      lastTransaction: null,
    }
  }

  // Helper to ensure an ad-hoc location exists
  const ensureLocation = (loc: string) => {
    if (!locationBalances[loc]) {
      locationBalances[loc] = {
        location: loc,
        balance: 0,
        transactions: 0,
        lastTransaction: null,
      }
    }
    return locationBalances[loc]
  }

  // 4. Process each transaction
  for (const t of transactions) {
    const loc = t.savingsLocation && t.savingsLocation.trim() ? t.savingsLocation.trim() : 'Tunai / Dompet'
    const catName = t.category?.name || ''
    const txDate = new Date(t.date)

    const targetAccount = ensureLocation(loc)
    const cashAccount = ensureLocation('Tunai / Dompet')

    if (catName === 'Tabungan') {
      // Transfer: Tunai / Dompet -> Target Account (loc)
      cashAccount.balance -= t.expense
      targetAccount.balance += t.expense

      targetAccount.transactions += 1
      targetAccount.lastTransaction = txDate
      if (loc !== 'Tunai / Dompet') {
        cashAccount.transactions += 1
        cashAccount.lastTransaction = txDate
      }
    } else if (catName === 'Penarikan Tabungan') {
      // Transfer: Target Account (loc) -> Tunai / Dompet
      targetAccount.balance -= t.income
      cashAccount.balance += t.income

      targetAccount.transactions += 1
      targetAccount.lastTransaction = txDate
      if (loc !== 'Tunai / Dompet') {
        cashAccount.transactions += 1
        cashAccount.lastTransaction = txDate
      }
    } else {
      // Regular Income / Expense on the targetAccount
      if (t.income > 0) {
        targetAccount.balance += t.income
        targetAccount.transactions += 1
        targetAccount.lastTransaction = txDate
      }
      if (t.expense > 0) {
        targetAccount.balance -= t.expense
        targetAccount.transactions += 1
        targetAccount.lastTransaction = txDate
      }
    }
  }

  // 5. Compute summaries
  const cashOnHand = locationBalances['Tunai / Dompet'] ? locationBalances['Tunai / Dompet'].balance : 0

  // Savings breakdown = all locations EXCEPT 'Tunai / Dompet'
  const breakdown = Object.values(locationBalances)
    .filter((acc) => acc.location !== 'Tunai / Dompet')
    .sort((a, b) => b.balance - a.balance)

  const totalSavings = breakdown.reduce((sum, acc) => sum + acc.balance, 0)
  const totalWealth = cashOnHand + totalSavings

  return {
    cashOnHand,
    totalSavings,
    totalWealth,
    locationBalances,
    breakdown,
  }
}
