import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { getBudgetPlanningData } from '@/lib/budget'
import { calculateAccountBalances } from '@/lib/accounts'
import { connection } from 'next/server'
import Link from 'next/link'
import { BookOpen, Building2, ChartPie, PiggyBank, Tags, Wallet } from 'lucide-react'
import QuickAddTransaction from '@/components/QuickAddTransaction'
import DatabaseStatusToast from '@/components/DatabaseStatusToast'

const MENU_ITEMS = [
  { href: '/transaksi', label: 'Transaksi', description: 'Catat pemasukan, belanja & kas', Icon: Wallet },
  { href: '/kategori', label: 'Kategori', description: 'Kelola pos belanja & icon emoji', Icon: Tags },
  { href: '/tabungan', label: 'Tabungan', description: 'Saldo rekening bank & dompet digital', Icon: PiggyBank },
  { href: '/tabungan/buku', label: 'Buku Tabungan', description: 'Riwayat mutasi tiap rekening', Icon: BookOpen },
  { href: '/budget', label: 'Anggaran', description: 'Target belanja & status pos', Icon: ChartPie },
  { href: '/reimbursement', label: 'Reimbursement', description: 'Klaim biaya & export laporan', Icon: Building2 },
]

const PANEL = 'bg-surface rounded-lg border border-gray-200 dark:border-gray-700'

function amountColor(amount: number) {
  return amount < 0 ? 'text-expense' : ''
}

export default async function Home() {
  // Balances must reflect the database at request time, never a build-time snapshot
  await connection()

  // Fetch summary data
  const categories = await prisma.category.findMany({
    where: { isActive: true }
  })

  const transactions = await prisma.transaction.findMany({
    take: 5,
    orderBy: { date: 'desc' },
    include: { category: true }
  })

  const totalIncome = await prisma.transaction.aggregate({
    _sum: { income: true }
  })

  const totalExpense = await prisma.transaction.aggregate({
    _sum: { expense: true }
  })

  // Get cash and savings data
  const cashData = await calculateAccountBalances()

  const pendingClaims = await prisma.reimbursement.findMany({
    where: { status: 'pending' },
    select: { transaction: { select: { expense: true } } },
  })
  const pendingClaimsTotal = pendingClaims.reduce((sum, claim) => sum + claim.transaction.expense, 0)

  // Get budget planning data for current month
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()
  let budgetData = null
  try {
    budgetData = await getBudgetPlanningData(currentMonth, currentYear)
  } catch (error) {
    console.error('Error fetching budget data for homepage:', error)
  }

  const savingsLocations = Object.entries(cashData.locationBalances).filter(([name]) => name !== 'Tunai / Dompet')

  return (
    <div className="min-h-screen bg-paper text-ink">
      <div className="container mx-auto max-w-6xl px-4 pt-8 pb-24">
        <header className="mb-6">
          <h1 className="text-3xl font-bold">Money Tracker</h1>
          <p className="text-ink-muted mt-1">
            Keuangan pribadi dan reimbursement kantor
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-6 mb-8">
          {/* Money position, set as a ledger sum */}
          <section aria-labelledby="posisi-uang" className={`${PANEL} p-6`}>
            <div className="flex flex-wrap items-baseline justify-between gap-x-4 mb-4">
              <h2 id="posisi-uang" className="text-lg font-semibold">Posisi uang saat ini</h2>
              <Link href="/tabungan/buku" className="text-sm font-medium text-accent hover:text-accent-hover whitespace-nowrap">
                Lihat buku tabungan
              </Link>
            </div>

            <Link href="/transaksi" className="flex items-baseline justify-between gap-4 py-2 hover:text-accent transition-colors">
              <span>Tunai di dompet</span>
              <span className={`font-medium whitespace-nowrap ${amountColor(cashData.cashOnHand)}`}>
                {formatCurrency(cashData.cashOnHand)}
              </span>
            </Link>

            <Link href="/tabungan" className="flex items-baseline justify-between gap-4 py-2 hover:text-accent transition-colors">
              <span>Tabungan</span>
              <span className={`font-medium whitespace-nowrap ${amountColor(cashData.totalSavings)}`}>
                {formatCurrency(cashData.totalSavings)}
              </span>
            </Link>

            {savingsLocations.length > 0 && (
              <ul className="pl-4 pb-2">
                {savingsLocations.map(([name, data]) => (
                  <li key={name} className="flex items-baseline justify-between gap-4 py-0.5 text-sm text-ink-muted">
                    <span>{name}</span>
                    <span className="whitespace-nowrap">{formatCurrency(data.balance)}</span>
                  </li>
                ))}
              </ul>
            )}

            <Link
              href="/tabungan/buku"
              className="flex flex-wrap items-baseline justify-between gap-x-4 mt-2 py-3 border-t border-gray-300 dark:border-gray-600 border-b-4 border-b-gray-800 dark:border-b-gray-200 [border-bottom-style:double] hover:text-accent transition-colors"
            >
              <span className="font-semibold">Total kekayaan</span>
              <span className={`text-3xl font-bold whitespace-nowrap ${amountColor(cashData.totalWealth)}`}>
                {formatCurrency(cashData.totalWealth)}
              </span>
            </Link>

            {pendingClaimsTotal > 0 && (
              <Link href="/reimbursement" className="flex flex-wrap items-baseline justify-between gap-x-4 pt-3 text-sm text-ink-muted hover:text-accent transition-colors">
                <span>Menunggu penggantian kantor, belum termasuk total</span>
                <span className="whitespace-nowrap">{formatCurrency(pendingClaimsTotal)}</span>
              </Link>
            )}
          </section>

          <div className="flex flex-col gap-6">
            {/* Budget for the current month */}
            <section aria-labelledby="anggaran" className={`${PANEL} p-6`}>
              {budgetData && budgetData.period.isConfigured ? (
                <>
                  <div className="flex items-baseline justify-between gap-4 mb-3">
                    <h2 id="anggaran" className="text-lg font-semibold">
                      Anggaran {budgetData.period.label}
                    </h2>
                    <Link href="/budget" className="text-sm font-medium text-accent hover:text-accent-hover whitespace-nowrap">
                      Lihat detail
                    </Link>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 mb-2">
                    <div
                      className={`h-full rounded-full ${
                        budgetData.totalExpensePercentage > 100
                          ? 'bg-expense'
                          : budgetData.totalExpensePercentage >= 80
                          ? 'bg-caution'
                          : 'bg-income'
                      }`}
                      style={{ width: `${Math.min(budgetData.totalExpensePercentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 text-sm mb-1">
                    <span className="font-semibold">{budgetData.totalExpensePercentage}% terpakai</span>
                    <span className={`font-semibold whitespace-nowrap ${budgetData.totalExpenseDifference >= 0 ? 'text-income' : 'text-expense'}`}>
                      {budgetData.totalExpenseDifference >= 0 ? 'Sisa' : 'Lebih'}{' '}
                      {formatCurrency(Math.abs(budgetData.totalExpenseDifference))}
                    </span>
                  </div>
                  <p className="text-sm text-ink-muted mb-3">
                    {formatCurrency(budgetData.totalActualExpense)} dari target {formatCurrency(budgetData.totalTargetExpense)}
                  </p>
                  <p className="flex flex-wrap gap-x-4 text-sm font-medium">
                    <span className="text-income">{budgetData.statusCounts.ok} aman</span>
                    <span className="text-caution">{budgetData.statusCounts.alert} hampir habis</span>
                    <span className="text-expense">{budgetData.statusCounts.over} melebihi target</span>
                  </p>
                </>
              ) : (
                <>
                  <h2 id="anggaran" className="text-lg font-semibold mb-1">Anggaran bulan ini</h2>
                  <p className="text-sm text-ink-muted mb-3">
                    {budgetData
                      ? 'Anggaran bulan ini belum diatur.'
                      : 'Data anggaran tidak bisa dimuat.'}
                  </p>
                  <Link href="/budget" className="text-sm font-medium text-accent hover:text-accent-hover">
                    Buka halaman anggaran
                  </Link>
                </>
              )}
            </section>

            {/* All-time totals */}
            <section aria-label="Total seluruh catatan" className={`${PANEL} p-6`}>
              <Link href="/transaksi" className="flex items-baseline justify-between gap-4 py-1 hover:underline">
                <span>Total pemasukan</span>
                <span className="font-semibold text-income whitespace-nowrap">
                  {formatCurrency(totalIncome._sum.income || 0)}
                </span>
              </Link>
              <Link href="/transaksi" className="flex items-baseline justify-between gap-4 py-1 hover:underline">
                <span>Total pengeluaran</span>
                <span className="font-semibold text-expense whitespace-nowrap">
                  {formatCurrency(totalExpense._sum.expense || 0)}
                </span>
              </Link>
              <p className="text-xs text-ink-muted mt-2">Dihitung dari seluruh catatan transaksi</p>
            </section>
          </div>
        </div>

        <nav aria-labelledby="menu-utama" className="mb-8">
          <h2 id="menu-utama" className="text-lg font-semibold mb-3">Menu utama</h2>
          <ul className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {MENU_ITEMS.map(({ href, label, description, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={`${PANEL} flex h-full flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 p-4 hover:border-accent transition-colors`}
                >
                  <Icon aria-hidden="true" className="size-6 shrink-0 text-accent" />
                  <span className="min-w-0">
                    <span className="block font-semibold">{label}</span>
                    <span className="block text-sm text-ink-muted mt-0.5">{description}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Recent Transactions */}
        <section aria-labelledby="transaksi-terakhir" className={`${PANEL} p-6`}>
          <div className="flex items-baseline justify-between gap-4 mb-2">
            <h2 id="transaksi-terakhir" className="text-lg font-semibold">Transaksi terakhir</h2>
            <Link href="/transaksi" className="text-sm font-medium text-accent hover:text-accent-hover whitespace-nowrap">
              Lihat semua
            </Link>
          </div>

          {transactions.length === 0 ? (
            <p className="py-6 text-ink-muted">
              Belum ada transaksi. Pilih Tambah Cepat di kanan bawah untuk mencatat yang pertama.
            </p>
          ) : (
            <ul className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((transaction) => (
                <li key={transaction.id} className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span aria-hidden="true" className="text-2xl">{transaction.category.icon || '📦'}</span>
                    <div className="min-w-0">
                      <p className="font-medium break-words">{transaction.description}</p>
                      <p className="text-sm text-ink-muted">
                        {transaction.category.name}
                        {transaction.savingsLocation && `, ${transaction.savingsLocation}`}
                        {', '}
                        {new Date(transaction.date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  {transaction.income > 0 ? (
                    <p className="font-semibold text-income whitespace-nowrap">
                      +{formatCurrency(transaction.income)}
                    </p>
                  ) : (
                    <p className="font-semibold text-expense whitespace-nowrap">
                      -{formatCurrency(transaction.expense)}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        <DatabaseStatusToast categoryCount={categories.length} />
        <QuickAddTransaction />
      </div>
    </div>
  )
}
