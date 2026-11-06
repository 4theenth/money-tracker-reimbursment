'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useNotification } from '@/contexts/NotificationContext'
import Link from 'next/link'

interface Transaction {
  id: number
  date: string
  description: string
  debit: number
  credit: number
  savingsLocation: string
  category: {
    name: string
    icon: string | null
  }
  runningBalance: number
}

interface PassbookData {
  location: string
  locationTitle?: string
  period: {
    month: number
    year: number
  }
  startBalance: number
  endBalance: number
  totalDebit: number
  totalCredit: number
  transactions: Transaction[]
}

export default function BukuTabunganPage() {
  const { showSuccess, showError } = useNotification()
  const [passbook, setPassbook] = useState<PassbookData | null>(null)
  const [locations, setLocations] = useState<string[]>([])
  const [selectedLocation, setSelectedLocation] = useState('all')
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [exportingExcel, setExportingExcel] = useState(false)
  const [exportingPdf, setExportingPdf] = useState(false)

  useEffect(() => {
    const now = new Date()
    setSelectedMonth((now.getMonth() + 1).toString())
    setSelectedYear(now.getFullYear().toString())
    fetchLocations()
  }, [])

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchPassbook()
    }
  }, [selectedMonth, selectedYear, selectedLocation])

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/settings/savings-locations')
      const data = await res.json()
      setLocations(data.locations || ['Tunai / Dompet', 'Bank BCA', 'Bank BRI'])
    } catch (error) {
      console.error('Error fetching locations:', error)
    }
  }

  const fetchPassbook = async () => {
    try {
      setLoading(true)
      const locParam = selectedLocation ? `&location=${encodeURIComponent(selectedLocation)}` : ''
      const res = await fetch(`/api/savings/passbook?month=${selectedMonth}&year=${selectedYear}${locParam}`)
      const data = await res.json()
      setPassbook(data)
    } catch (error) {
      console.error('Error fetching passbook:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleExportExcel = async () => {
    try {
      setExportingExcel(true)
      showSuccess('Menyiapkan file Excel...')
      const locParam = selectedLocation ? `&location=${encodeURIComponent(selectedLocation)}` : ''
      const res = await fetch(`/api/savings/passbook/excel?month=${selectedMonth}&year=${selectedYear}${locParam}`)
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal mengekspor data Excel')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeLoc = (selectedLocation === 'all' ? 'Semua_Rekening' : selectedLocation).replace(/[^a-zA-Z0-9]/g, '_')
      a.download = `Buku_Tabungan_${safeLoc}_${selectedMonth}_${selectedYear}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showSuccess('File Excel berhasil diunduh!')
    } catch (error: any) {
      console.error('Export Excel error:', error)
      showError(error.message || 'Gagal export Excel')
    } finally {
      setExportingExcel(false)
    }
  }

  const handleExportPdf = async () => {
    try {
      setExportingPdf(true)
      showSuccess('Menyiapkan dokumen PDF...')
      const locParam = selectedLocation ? `&location=${encodeURIComponent(selectedLocation)}` : ''
      const res = await fetch(`/api/savings/passbook/pdf?month=${selectedMonth}&year=${selectedYear}${locParam}`)
      
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal mengekspor data PDF')
      }

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const safeLoc = (selectedLocation === 'all' ? 'Semua_Rekening' : selectedLocation).replace(/[^a-zA-Z0-9]/g, '_')
      a.download = `Buku_Tabungan_${safeLoc}_${selectedMonth}_${selectedYear}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      showSuccess('File PDF berhasil diunduh!')
    } catch (error: any) {
      console.error('Export PDF error:', error)
      showError(error.message || 'Gagal export PDF')
    } finally {
      setExportingPdf(false)
    }
  }

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

  const getAccountTitle = () => {
    return passbook?.locationTitle?.toUpperCase() || 'SEMUA AKUN (KAS TUNAI & BANK)'
  }

  const transactions = passbook?.transactions || []

  return (
    <div className="min-h-screen bg-paper p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 print:mb-4">
          <div>
            <Link 
              href="/tabungan"
              className="text-accent hover:text-accent-hover text-sm mb-2 inline-flex items-center gap-1 font-medium print:hidden"
            >
              ← Kembali ke Dashboard Tabungan
            </Link>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white print:text-2xl">
              📖 Buku Tabungan & Mutasi Rekening
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1 print:text-sm">
              Rekap aliran dana debit, kredit, dan saldo berjalan
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6 print:hidden">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              {/* Account Filter */}
              <div className="flex flex-wrap items-center gap-2 max-w-full">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Rekening:
                </label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="max-w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm font-medium focus:ring-2 focus:ring-accent"
                >
                  <option value="all">🌐 Semua Akun (Kas Tunai & Bank)</option>
                  <option value="savings">🏦 Semua Rekening Bank Saja</option>
                  {locations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc.toLowerCase().includes('tunai') ? '💵' : '🏦'} {loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Period Filter */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Periode:
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exportingExcel || loading}
                className="px-3.5 py-2 bg-income-solid hover:bg-income-solid-hover disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 text-sm shadow cursor-pointer"
                title="Download mutasi buku tabungan format Excel (.xlsx)"
              >
                <span>📊</span>
                <span>{exportingExcel ? 'Exporting...' : 'Export Excel'}</span>
              </button>

              <button
                type="button"
                onClick={handleExportPdf}
                disabled={exportingPdf || loading}
                className="px-3.5 py-2 bg-expense-solid hover:bg-expense-solid-hover disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 text-sm shadow cursor-pointer"
                title="Download mutasi buku tabungan format PDF (.pdf)"
              >
                <span>📄</span>
                <span>{exportingPdf ? 'Exporting...' : 'Download PDF'}</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-3.5 py-2 bg-brand-primary hover:bg-brand-primary-hover text-white rounded-lg font-medium transition-colors flex items-center gap-1.5 text-sm shadow cursor-pointer"
                title="Buka dialog cetak browser"
              >
                <span>🖨️</span>
                <span>Cetak</span>
              </button>
            </div>
          </div>
        </div>

        {/* Passbook Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden print:shadow-none border border-gray-200 dark:border-gray-700">
          {/* Header Passbook */}
          <div className="bg-brand-primary text-white p-6 text-center print:bg-gray-800">
            <div className="text-2xl tracking-widest opacity-60 mb-1">
              =============================================
            </div>
            <h2 className="text-xl font-bold tracking-wide print:text-lg">
              BUKU TABUNGAN & REKENING KORAN
            </h2>
            <div className="inline-block mt-2 px-3 py-1 border border-white/60 rounded-full text-xs font-semibold tracking-wider">
              {getAccountTitle()}
            </div>
            <p className="text-xs text-white mt-2">
              Periode: {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </p>
            <div className="text-2xl tracking-widest opacity-60 mt-1">
              =============================================
            </div>
          </div>

          {/* Quick Balance Cards on Top of Table */}
          {passbook && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-4 bg-gray-50 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700 text-xs">
              <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 block">Saldo Awal:</span>
                <span className="font-bold text-gray-800 dark:text-gray-200 text-sm">
                  {formatCurrency(passbook.startBalance)}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 block">Total Masuk (Kredit):</span>
                <span className="font-bold text-income text-sm">
                  +{formatCurrency(passbook.totalCredit)}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 block">Total Keluar (Debit):</span>
                <span className="font-bold text-expense text-sm">
                  -{formatCurrency(passbook.totalDebit)}
                </span>
              </div>
              <div className="p-3 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
                <span className="text-gray-500 dark:text-gray-400 block">Saldo Akhir:</span>
                <span className="font-bold text-accent text-sm">
                  {formatCurrency(passbook.endBalance)}
                </span>
              </div>
            </div>
          )}

          {loading ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">📖</div>
              <p>Memuat mutasi buku tabungan...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="p-12 text-center text-gray-500 dark:text-gray-400">
              <div className="text-6xl mb-4">📖</div>
              <p className="text-lg font-semibold mb-1 text-gray-700 dark:text-gray-300">
                Tidak ada transaksi pada periode ini
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Saldo Awal: {passbook ? formatCurrency(passbook.startBalance) : 'Rp 0'} • Saldo Akhir: {passbook ? formatCurrency(passbook.endBalance) : 'Rp 0'}
              </p>
            </div>
          ) : (
            <>
              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100 dark:bg-gray-700 print:bg-gray-100 border-b border-gray-200 dark:border-gray-600">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Tanggal
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Keterangan & Rekening
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-expense uppercase tracking-wider">
                        Debit (Keluar)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-income uppercase tracking-wider">
                        Kredit (Masuk)
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                        Saldo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    {transactions.map((t, index) => (
                      <tr 
                        key={t.id}
                        className={`${
                          index % 2 === 0 
                            ? 'bg-white dark:bg-gray-800' 
                            : 'bg-gray-50/60 dark:bg-gray-800/50'
                        } hover:bg-status-info-light dark:hover:bg-gray-700 transition-colors print:bg-white`}
                      >
                        <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                          {formatDate(t.date)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-start gap-2">
                            <span className="text-lg">{t.category?.icon || '📝'}</span>
                            <div>
                              <div className="font-medium text-gray-800 dark:text-gray-200">
                                {t.description}
                              </div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Kategori: {t.category?.name} • Akun: <span className="font-semibold text-accent">{t.savingsLocation}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {t.debit > 0 ? (
                            <span className="text-expense font-semibold text-sm">
                              -{formatCurrency(t.debit)}
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {t.credit > 0 ? (
                            <span className="text-income font-semibold text-sm">
                              +{formatCurrency(t.credit)}
                            </span>
                          ) : (
                            <span className="text-gray-500 dark:text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">
                          {formatCurrency(t.runningBalance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="bg-gray-100 dark:bg-gray-700 p-6 border-t-2 border-gray-300 dark:border-gray-600 print:bg-gray-50">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm font-semibold text-gray-600 dark:text-gray-300">
                    RINGKASAN AKHIR PERIODE ({months.find(m => m.value === selectedMonth)?.label} {selectedYear})
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">Saldo Akhir:</span>
                    <span className="text-2xl font-bold text-accent print:text-xl">
                      {passbook ? formatCurrency(passbook.endBalance) : 'Rp 0'}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Print Info */}
        <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400 print:hidden">
          <p>💡 Tips: Gunakan tombol Print untuk export mutasi buku tabungan ke format PDF atau cetak fisik.</p>
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
