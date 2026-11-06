import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import { getBudgetPlanningData } from '@/lib/budget'
import { calculateAccountBalances, getMonthlyCashFlow } from '@/lib/accounts'
import { connection } from 'next/server'
import Link from 'next/link'
import { PiggyBank, Wallet, type LucideIcon } from 'lucide-react'
import CashFlowChart from '@/components/CashFlowChart'
import QuickAddTransaction from '@/components/QuickAddTransaction'
import DatabaseStatusToast from '@/components/DatabaseStatusToast'

const PANEL = 'bg-surface rounded-xl border border-gray-200 dark:border-gray-700'
const PANEL_LINK = 'text-sm font-medium text-accent hover:text-accent-hover whitespace-nowrap'

function amountColor(amount: number) {
  return amount < 0 ? 'text-expense' : ''
}

function BalanceCard({ label, amount, href, linkLabel, Icon }: {
  label: string
  amount: number
  href: string
  linkLabel: string
  Icon: LucideIcon
}) {
  return (
    <section aria-label={label} className={`${PANEL} flex flex-col p-5`}>
      <p className="flex items-center gap-2 text-sm font-medium text-ink-muted">
        <Icon aria-hidden="true" className="size-5 text-accent" />
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold break-words ${amountColor(amount)}`}>{formatCurrency(amount)}</p>
      <Link href={href} className={`${PANEL_LINK} mt-auto pt-3`}>{linkLabel}</Link>
    </section>
  )
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
  const cashFlow = await getMonthlyCashFlow()

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
    <div className="mx-auto max-w-7xl px-4 md:px-8 pt-6 md:pt-8 pb-24 text-ink">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-ink-muted mt-1">Keuangan pribadi dan reimbursement kantor</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,1fr)] gap-4 mb-4">
        <section aria-label="Total kekayaan" className="on-brand sm:col-span-2 lg:col-span-1 flex flex-col rounded-xl bg-brand-primary p-6 text-white">
          <p className="text-sm font-medium text-white/90">Total kekayaan</p>
          <p className="mt-2 text-3xl xl:text-4xl font-bold break-words">{formatCurrency(cashData.totalWealth)}</p>
          <p className="mt-1 text-sm text-white/90">Tunai ditambah semua tabungan</p>
          <Link href="/tabungan/buku" className="mt-auto pt-4 text-sm font-medium text-white underline underline-offset-4">
            Lihat buku tabungan
          </Link>
        </section>
        <BalanceCard label="Tunai di dompet" amount={cashData.cashOnHand} href="/transaksi" linkLabel="Lihat transaksi" Icon={Wallet} />
        <BalanceCard label="Tabungan" amount={cashData.totalSavings} href="/tabungan" linkLabel="Lihat tabungan" Icon={PiggyBank} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-4 mb-4">
        <div className="flex flex-col gap-4 min-w-0">
          <section aria-labelledby="rekening" className={`${PANEL} p-5`}>
            <h2 id="rekening" className="text-lg font-semibold mb-3">Rekening tabungan</h2>
            {savingsLocations.length > 0 ? (
              <ul className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3">
                {savingsLocations.map(([name, data]) => (
                  <li key={name} className="rounded-lg bg-paper p-3 min-w-0">
                    <p className="text-sm text-ink-muted break-words">{name}</p>
                    <p className={`mt-1 font-semibold break-words ${amountColor(data.balance)}`}>{formatCurrency(data.balance)}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-ink-muted">Belum ada rekening. Tambahkan lewat halaman Tabungan.</p>
            )}
          </section>

          <section aria-labelledby="ringkasan-catatan" className={`${PANEL} p-5`}>
            <h2 id="ringkasan-catatan" className="text-lg font-semibold mb-3">Ringkasan catatan</h2>
            <dl className="space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <dt>Total pemasukan</dt>
                <dd className="font-semibold text-income whitespace-nowrap">{formatCurrency(totalIncome._sum.income || 0)}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt>Total pengeluaran</dt>
                <dd className="font-semibold text-expense whitespace-nowrap">{formatCurrency(totalExpense._sum.expense || 0)}</dd>
              </div>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 border-t border-gray-200 dark:border-gray-700 pt-2">
                <dt>
                  <Link href="/reimbursement" className="text-accent hover:text-accent-hover font-medium">Menunggu penggantian kantor</Link>
                </dt>
                <dd className="font-semibold whitespace-nowrap">{formatCurrency(pendingClaimsTotal)}</dd>
              </div>
            </dl>
            <p className="text-xs text-ink-muted mt-2">
              Total dihitung dari seluruh transaksi. Klaim yang menunggu belum termasuk Total kekayaan.
            </p>
          </section>
        </div>

        <section aria-labelledby="arus-kas" className={`${PANEL} p-5 min-w-0`}>
          <h2 id="arus-kas" className="text-lg font-semibold">Arus kas</h2>
          <p className="text-sm text-ink-muted mb-3">6 bulan terakhir, tanpa perpindahan antara tunai dan tabungan</p>
          <CashFlowChart data={cashFlow} />
        </section>
      </div>

      <div className="mb-4">
        {/* Budget for the current month */}
        <section aria-labelledby="anggaran" className={`${PANEL} p-5`}>
          {budgetData && budgetData.period.isConfigured ? (
            <>
              <div className="flex items-baseline justify-between gap-4 mb-3">
                <h2 id="anggaran" className="text-lg font-semibold">
                  Anggaran {budgetData.period.label}
                </h2>
                <Link href="/budget" className={PANEL_LINK}>Lihat detail</Link>
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
              <Link href="/budget" className={PANEL_LINK}>Buka halaman anggaran</Link>
            </>
          )}
        </section>

      </div>

      {/* Recent Transactions */}
      <section aria-labelledby="transaksi-terakhir" className={`${PANEL} p-5`}>
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <h2 id="transaksi-terakhir" className="text-lg font-semibold">Transaksi terakhir</h2>
          <Link href="/transaksi" className={PANEL_LINK}>Lihat semua</Link>
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
                    <p className="font-medium [overflow-wrap:anywhere]">{transaction.description}</p>
                    <p className="text-sm text-ink-muted [overflow-wrap:anywhere]">
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
  )
}
