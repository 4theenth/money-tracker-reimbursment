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
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
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
              <div className="text-5xl opacity-80">💵</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm mb-1">Total Tabungan</p>
                <p className={`text-3xl font-bold ${
                  cashData.totalSavings >= 0 ? '' : 'text-red-200'
                }`}>
                  {formatCurrency(cashData.totalSavings)}
                </p>
                <p className="text-purple-100 text-xs mt-2">Di bank & dompet digital</p>
              </div>
              <div className="text-5xl opacity-80">🏦</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
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
              <div className="text-5xl opacity-80">💎</div>
            </div>
          </div>
        </div>

        {/* Summary Cards - Income & Expense */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Pemasukan</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalIncome._sum.income || 0)}
                </p>
              </div>
              <div className="text-4xl">📈</div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">Total Pengeluaran</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(totalExpense._sum.expense || 0)}
                </p>
              </div>
              <div className="text-4xl">📉</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link
            href="/transaksi"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="text-3xl mb-2">💰</div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Transaksi</p>
          </Link>
          <Link
            href="/kategori"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="text-3xl mb-2">🏷️</div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Kategori</p>
          </Link>
          <Link
            href="/tabungan"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="text-3xl mb-2">💎</div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Tabungan</p>
          </Link>
          <Link
            href="/reimbursement"
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="text-3xl mb-2">🏢</div>
            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reimbursement</p>
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
