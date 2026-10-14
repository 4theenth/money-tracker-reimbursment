'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'

interface Transaction {
  id: number
  date: string
  description: string
  expense: number
  income: number
  savingsLocation: string | null
  category: {
    name: string
    icon: string | null
  }
  runningBalance: number
}

export default function BukuTabunganPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  useEffect(() => {
    // Set default to current month/year
    const now = new Date()
    setSelectedMonth((now.getMonth() + 1).toString())
    setSelectedYear(now.getFullYear().toString())
  }, [])

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchTransactions()
    }
  }, [selectedMonth, selectedYear])

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/savings/passbook?month=${selectedMonth}&year=${selectedYear}`)
      const data = await res.json()
      setTransactions(data.transactions || [])
    } catch (error) {
      console.error('Error fetching passbook:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const currentBalance = transactions.length > 0 
    ? transactions[transactions.length - 1].runningBalance 
    : 0

  const months = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ]

  const years = ['2024', '2025', '2026', '2027', '2028']

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:mb-4">
          <div>
            <Link 
              href="/tabungan"
              className="text-blue-600 hover:text-blue-700 text-sm mb-2 inline-block print:hidden"
            >
              ← Kembali ke Dashboard
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white print:text-2xl">
              📖 Buku Tabungan
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1 print:text-sm">
              Riwayat transaksi tabungan lengkap
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6 print:hidden">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Periode:
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                {months.map(m => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                {years.map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handlePrint}
              className="ml-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              🖨️ Print / Export PDF
            </button>
          </div>
        </div>

        {/* Passbook Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden print:shadow-none">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 text-center print:bg-gray-800">
            <div className="text-2xl font-bold mb-2 print:text-xl">
              ═══════════════════════════════════════
            </div>
            <h2 className="text-xl font-bold print:text-lg">
              BUKU TABUNGAN - RIWAYAT LENGKAP
            </h2>
            <p className="text-sm text-blue-100 mt-1">
              Periode: {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </p>
            <div className="text-2xl font-bold mt-2 print:text-xl">
              ═══════════════════════════════════════
            </div>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-4xl mb-2">📖</div>
              <p>Loading...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-lg mb-2">Tidak ada transaksi</p>
              <p className="text-sm text-gray-400">
                Belum ada transaksi tabungan di periode ini
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700 print:bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-xs">
                        Tanggal
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-xs">
                        Keterangan
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-xs">
                        Debit
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-xs">
                        Kredit
                      </th>
                      <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300 print:text-xs">
                        Saldo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {transactions.map((transaction, index) => {
                      const isDebit = transaction.income > 0 // Ambil tabungan
                      const isCredit = transaction.expense > 0 // Nabung / Bunga

                      return (
                        <tr 
                          key={transaction.id}
                          className={`${
                            index % 2 === 0 
                              ? 'bg-white dark:bg-gray-800' 
                              : 'bg-gray-50 dark:bg-gray-750'
                          } print:bg-white`}
                        >
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 print:text-xs">
                            {formatDate(transaction.date)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 print:text-xs">
                            <div className="flex items-center gap-2">
                              <span>{transaction.category.icon}</span>
                              <div>
                                <div>{transaction.description}</div>
                                {transaction.savingsLocation && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    ({transaction.savingsLocation})
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-right print:text-xs">
                            {isDebit ? (
                              <span className="text-red-600 font-semibold">
                                {formatCurrency(transaction.income)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right print:text-xs">
                            {isCredit ? (
                              <span className="text-green-600 font-semibold">
                                {formatCurrency(transaction.expense)}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right font-bold text-gray-800 dark:text-gray-200 print:text-xs">
                            {formatCurrency(transaction.runningBalance)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 p-6 border-t-2 border-gray-300 dark:border-gray-600 print:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-lg font-bold text-gray-800 dark:text-white">
                    SALDO AKHIR PERIODE:
                  </div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 print:text-xl">
                    {formatCurrency(currentBalance)}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Print Info */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 print:hidden">
          <p>💡 Tips: Gunakan tombol Print untuk save sebagai PDF atau print langsung</p>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx global>{`
        @media print {
          body {
            background: white !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:bg-white {
            background: white !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
        }
      `}</style>
    </div>
  )
}
