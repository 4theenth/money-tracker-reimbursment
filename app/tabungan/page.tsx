'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Category {
  id: number
  name: string
  icon: string | null
}

interface Transaction {
  id: number
  date: string
  description: string
  expense: number
  income: number
  savingsLocation: string | null
  category: Category
}

interface SavingsSummary {
  total: number
  count: number
  average: number
}

interface MonthlyData {
  month: string
  total: number
  count: number
}

interface LocationBreakdown {
  location: string
  balance: number
  transactions: number
  lastTransaction: string | null
}

interface SavingsData {
  summary: SavingsSummary
  transactions: Transaction[]
  monthlyData: MonthlyData[]
}

export default function TabunganPage() {
  const [data, setData] = useState<SavingsData | null>(null)
  const [breakdown, setBreakdown] = useState<LocationBreakdown[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSavings()
    fetchBreakdown()
  }, [])

  const fetchSavings = async () => {
    try {
      const res = await fetch('/api/savings')
      const savingsData = await res.json()
      setData(savingsData)
    } catch (error) {
      console.error('Error fetching savings:', error)
    }
  }

  const fetchBreakdown = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/savings/breakdown')
      const breakdownData = await res.json()
      setBreakdown(breakdownData.breakdown || [])
    } catch (error) {
      console.error('Error fetching breakdown:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalBalance = breakdown.reduce((sum, item) => sum + item.balance, 0)

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">💎</div>
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              💎 Tracking Tabungan
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Monitor perkembangan tabungan per lokasi
            </p>
          </div>
          <Link
            href="/transaksi"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
          >
            + Tambah Tabungan
          </Link>
        </div>

        {/* Total Summary */}
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm mb-2">Total Tabungan Semua Lokasi</p>
              <p className="text-5xl font-bold mb-2">
                {formatCurrency(totalBalance)}
              </p>
              <p className="text-purple-100 text-sm">
                Tersebar di {breakdown.length} lokasi
              </p>
            </div>
            <div className="text-7xl opacity-80">🏦</div>
          </div>
        </div>

        {/* Breakdown by Location */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
            Saldo per Lokasi
          </h2>
          
          {breakdown.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🏦</div>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                Belum ada tabungan di lokasi manapun
              </p>
              <p className="text-gray-500 dark:text-gray-500 text-sm mb-6">
                Mulai menabung dengan kategori "Tabungan" dan pilih lokasi
              </p>
              <Link
                href="/transaksi"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                + Mulai Nabung
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {breakdown.map((item) => {
                // Icon mapping per location
                const getLocationIcon = (location: string) => {
                  if (location.toLowerCase().includes('bca')) return '🔵'
                  if (location.toLowerCase().includes('mandiri')) return '🔷'
                  if (location.toLowerCase().includes('bri')) return '🟦'
                  if (location.toLowerCase().includes('bni')) return '🟧'
                  if (location.toLowerCase().includes('gopay')) return '💚'
                  if (location.toLowerCase().includes('dana')) return '💙'
                  if (location.toLowerCase().includes('ovo')) return '💜'
                  if (location.toLowerCase().includes('shopee')) return '🧡'
                  if (location.toLowerCase().includes('celengan')) return '🐷'
                  return '🏦'
                }

                return (
                  <div
                    key={item.location}
                    className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">{getLocationIcon(item.location)}</span>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {item.location}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {item.transactions} transaksi
                        </p>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Saldo Saat Ini</p>
                      <p className={`text-3xl font-bold ${
                        item.balance >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {formatCurrency(item.balance)}
                      </p>
                    </div>

                    {item.lastTransaction && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Terakhir: {formatDate(item.lastTransaction)}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        {data && (
          <div className="mb-6">
            <div className="flex items-center gap-4 mb-4">
              <Link
                href="/tabungan/buku"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                📖 Lihat Buku Tabungan
              </Link>
              <Link
                href="/transaksi"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                + Tambah Tabungan
              </Link>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        {data && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Total Setoran
                </p>
                <div className="text-3xl">💰</div>
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {formatCurrency(data.summary.total || 0)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Akumulasi nabung
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Jumlah Transaksi
                </p>
                <div className="text-3xl">📊</div>
              </div>
              <p className="text-3xl font-bold text-green-600">
                {data.summary.count || 0}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Total kali transaksi
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Rata-rata
                </p>
                <div className="text-3xl">📈</div>
              </div>
              <p className="text-3xl font-bold text-purple-600">
                {formatCurrency(data.summary.average || 0)}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Per transaksi
              </p>
            </div>
          </div>
        )}

        {/* Monthly Breakdown */}
        {data && data.monthlyData.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Tabungan per Bulan
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.monthlyData.map((item) => {
                const [year, month] = item.month.split('-')
                const monthNames = [
                  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
                ]
                const monthName = monthNames[parseInt(month) - 1]

                return (
                  <div
                    key={item.month}
                    className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-lg p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                        {monthName} {year}
                      </p>
                      <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                        {item.count}x
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(item.total)}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Transactions List */}
        {data && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
              Riwayat Transaksi
            </h2>

            {data.transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">💎</div>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">
                  Belum ada transaksi tabungan
                </p>
                <Link
                  href="/transaksi"
                  className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold mt-4"
                >
                  + Tambah Tabungan Pertama
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {data.transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                        <span className="text-2xl">{transaction.category.icon || '💰'}</span>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {transaction.description}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {transaction.category.name}
                          {transaction.savingsLocation && ` • ${transaction.savingsLocation}`}
                          {' • '}
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {transaction.income > 0 ? (
                        <p className="text-xl font-bold text-green-600">
                          +{formatCurrency(transaction.income)}
                        </p>
                      ) : (
                        <p className="text-xl font-bold text-blue-600">
                          {formatCurrency(transaction.expense)}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="text-4xl">💡</div>
            <div>
              <h3 className="text-xl font-bold mb-2">Tips Tracking Tabungan</h3>
              <ul className="space-y-2 text-sm">
                <li>• Pilih lokasi tabungan untuk tracking otomatis per bank/dompet</li>
                <li>• Gunakan "Penarikan Tabungan" saat ambil uang dari tabungan</li>
                <li>• Gunakan "Bunga Tabungan" saat dapat interest dari bank</li>
                <li>• Saldo per lokasi dihitung otomatis dari semua transaksi</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
