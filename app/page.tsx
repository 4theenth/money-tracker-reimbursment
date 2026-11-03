import { prisma } from '@/lib/prisma'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import QuickAddTransaction from '@/components/QuickAddTransaction'

async function getCashData() {
  const res = await fetch('http://localhost:3000/api/cash', { 
    cache: 'no-store',
    next: { revalidate: 0 }
  })
  if (!res.ok) {
    return { cashOnHand: 0, totalSavings: 0, totalWealth: 0 }
  }
  return res.json()
}

export default async function Home() {
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
  const cashData = await getCashData()

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 dark:text-white mb-2">
            💰 Money Tracker
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Kelola keuangan pribadi dan reimbursement kantor Anda
          </p>
        </header>

        {/* Main Summary Cards - Cash & Wealth */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Link
            href="/transaksi"
            className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 block"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm mb-1">Cash On Hand</p>
                <p className={`text-3xl font-bold ${
                  cashData.cashOnHand >= 0 ? '' : 'text-red-200'
                }`}>
                  {formatCurrency(cashData.cashOnHand)}
                </p>
                <p className="text-green-100 text-xs mt-2">Uang di tangan/dompet</p>
              </div>
              <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform">💵</div>
            </div>
            <div className="mt-4 pt-2 border-t border-white/20 flex items-center justify-between text-xs text-green-100 font-medium">
              <span>Buka Catatan Transaksi</span>
              <span className="group-hover:translate-x-1 transition-transform font-bold">→</span>
            </div>
          </Link>

          <Link
            href="/tabungan"
            className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 block"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Total Tabungan</p>
                <p className={`text-3xl font-bold ${
                  cashData.totalSavings >= 0 ? '' : 'text-red-200'
                }`}>
                  {formatCurrency(cashData.totalSavings)}
                </p>
                <p className="text-purple-100 text-xs mt-2">Di bank & dompet digital</p>
                {cashData.locationBalances && (
                  <div className="mt-2 text-xs text-purple-100/90 flex flex-wrap gap-1.5">
                    {Object.entries(cashData.locationBalances)
                      .filter(([name]) => name !== 'Tunai / Dompet')
                      .map(([name, data]: [string, any]) => (
                        <span key={name} className="bg-purple-700/50 px-2 py-0.5 rounded text-[11px] font-medium">
                          {name}: {formatCurrency(data.balance)}
                        </span>
                      ))}
                  </div>
                )}
              </div>
              <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform">🏦</div>
            </div>
            <div className="mt-4 pt-2 border-t border-white/20 flex items-center justify-between text-xs text-purple-100 font-medium">
              <span>Kelola Saldo Rekening</span>
              <span className="group-hover:translate-x-1 transition-transform font-bold">→</span>
            </div>
          </Link>

          <Link
            href="/tabungan/buku"
            className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-200 block"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Kekayaan</p>
                <p className={`text-3xl font-bold ${
                  cashData.totalWealth >= 0 ? '' : 'text-red-200'
                }`}>
                  {formatCurrency(cashData.totalWealth)}
                </p>
                <p className="text-blue-100 text-xs mt-2">Cash + Tabungan</p>
              </div>
              <div className="text-5xl opacity-80 group-hover:scale-110 transition-transform">💎</div>
            </div>
            <div className="mt-4 pt-2 border-t border-white/20 flex items-center justify-between text-xs text-blue-100 font-medium">
              <span>Lihat Buku Tabungan & Mutasi</span>
              <span className="group-hover:translate-x-1 transition-transform font-bold">→</span>
            </div>
          </Link>
        </div>

        {/* Summary Cards - Income & Expense */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            href="/transaksi"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-transparent hover:border-green-500/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer block"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Pemasukan</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalIncome._sum.income || 0)}
                </p>
                <p className="text-xs text-green-600/80 dark:text-green-400/80 mt-1 font-medium group-hover:underline flex items-center gap-1">
                  <span>Lihat Riwayat Transaksi</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </p>
              </div>
              <div className="text-4xl group-hover:scale-110 transition-transform">📈</div>
            </div>
          </Link>

          <Link
            href="/transaksi"
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border border-transparent hover:border-red-500/40 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer block"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpense._sum.expense || 0)}
                </p>
                <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 font-medium group-hover:underline flex items-center gap-1">
                  <span>Lihat Riwayat Transaksi</span>
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </p>
              </div>
              <div className="text-4xl group-hover:scale-110 transition-transform">📉</div>
            </div>
          </Link>
        </div>

        {/* Quick Actions (Action Hub) */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">
            Menu Utama
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            Akses cepat fitur aplikasi
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/transaksi"
            className="group relative bg-white dark:bg-gray-800 rounded-xl p-5 border-2 border-emerald-500/20 hover:border-emerald-500 shadow hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 cursor-pointer block"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                💰
              </div>
              <span className="text-emerald-500 group-hover:translate-x-1 transition-transform text-base font-bold">
                →
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              Transaksi
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Catat pemasukan, belanja & kas
            </p>
          </Link>

          <Link
            href="/kategori"
            className="group relative bg-white dark:bg-gray-800 rounded-xl p-5 border-2 border-indigo-500/20 hover:border-indigo-500 shadow hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 cursor-pointer block"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                🏷️
              </div>
              <span className="text-indigo-500 group-hover:translate-x-1 transition-transform text-base font-bold">
                →
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              Kategori
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Kelola pos belanja & icon emoji
            </p>
          </Link>

          <Link
            href="/tabungan"
            className="group relative bg-white dark:bg-gray-800 rounded-xl p-5 border-2 border-blue-500/20 hover:border-blue-500 shadow hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 cursor-pointer block"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                💎
              </div>
              <span className="text-blue-500 group-hover:translate-x-1 transition-transform text-base font-bold">
                →
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              Tabungan
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Saldo rekening bank & passbook
            </p>
          </Link>

          <Link
            href="/reimbursement"
            className="group relative bg-white dark:bg-gray-800 rounded-xl p-5 border-2 border-purple-500/20 hover:border-purple-500 shadow hover:shadow-xl hover:-translate-y-1 active:scale-[0.98] transition-all duration-200 cursor-pointer block"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 transition-transform">
                🏢
              </div>
              <span className="text-purple-500 group-hover:translate-x-1 transition-transform text-base font-bold">
                →
              </span>
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              Reimbursement
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Klaim biaya & export laporan
            </p>
          </Link>
        </div>

        {/* Recent Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              Transaksi Terakhir
            </h2>
            <Link
              href="/transaksi"
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Lihat Semua →
            </Link>
          </div>
          
          {transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="text-4xl mb-2">📝</p>
              <p>Belum ada transaksi</p>
              <p className="text-sm mt-2">Gunakan tombol "Tambah Cepat" di kanan bawah!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{transaction.category.icon || '📦'}</div>
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-white">
                        {transaction.description}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.category.name}
                        {transaction.savingsLocation && ` • ${transaction.savingsLocation}`}
                        {' • '}
                        {new Date(transaction.date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {transaction.income > 0 ? (
                      <p className="font-bold text-green-600">
                        +{formatCurrency(transaction.income)}
                      </p>
                    ) : (
                      <p className="font-bold text-red-600">
                        -{formatCurrency(transaction.expense)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Status */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-full shadow">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600 dark:text-gray-300">
              Database terhubung • {categories.length} kategori tersedia
            </span>
          </div>
        </div>

        {/* Quick Add Button - Floating */}
        <QuickAddTransaction />
      </div>
    </div>
  )
}
