'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNotification } from '@/contexts/NotificationContext'
import { formatCurrency, formatDate } from '@/lib/utils'
import ImageUpload from '@/components/ImageUpload'

interface ReimbursementCategory {
  id: number
  name: string
  icon: string | null
  isActive: boolean
}

interface Category {
  id: number
  name: string
  type: string
  icon: string | null
  color: string | null
}

interface Transaction {
  id: number
  date: string
  categoryId: number
  description: string
  expense: number
  category: Category
}

interface Reimbursement {
  id: number
  transactionId: number
  officeCategoryId: number
  receiptPhoto: string | null
  notes: string | null
  status: string
  claimedAt: string | null
  createdAt: string
  transaction: Transaction
  officeCategory: ReimbursementCategory
}

export default function ReimbursementPage() {
  const { showSuccess, showError, confirm } = useNotification()
  const [reimbursements, setReimbursements] = useState<Reimbursement[]>([])
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: ''
  })
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    officeCategoryId: '',
    description: '',
    amount: '',
    notes: '',
    receiptPhoto: ''
  })
  const [reimbursementCategories, setReimbursementCategories] = useState<ReimbursementCategory[]>([])

  useEffect(() => {
    fetchReimbursements()
    fetchReimbursementCategories()
  }, [filters])

  const fetchReimbursementCategories = async () => {
    try {
      const res = await fetch('/api/reimbursement-categories')
      const data = await res.json()
      setReimbursementCategories(data)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const fetchReimbursements = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      
      if (filters.status) params.append('status', filters.status)
      if (filters.month) params.append('month', filters.month.toString())
      if (filters.year) params.append('year', filters.year.toString())

      const res = await fetch(`/api/reimbursements?${params}`)
      const data = await res.json()
      setReimbursements(data)
    } catch (error) {
      console.error('Error fetching reimbursements:', error)
      showError('Gagal memuat data reimbursement')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsClaimed = (reimbursement: Reimbursement) => {
    confirm({
      title: 'Tandai Sudah Dibayar',
      message: `Tandai reimbursement "${reimbursement.transaction.description}" sebagai sudah dibayar?`,
      confirmLabel: 'Ya, Sudah Dibayar',
      cancelLabel: 'Batal',
      confirmVariant: 'success',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/reimbursements/${reimbursement.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'claimed' }),
          })

          if (!res.ok) {
            showError('Gagal update status')
            return
          }

          showSuccess('Status berhasil diupdate!')
          fetchReimbursements()
        } catch (error) {
          console.error('Error updating status:', error)
          showError('Gagal update status')
        }
      },
    })
  }

  const handleDelete = (reimbursement: Reimbursement) => {
    confirm({
      title: 'Hapus Reimbursement',
      message: `Yakin ingin menghapus reimbursement "${reimbursement.transaction.description}"? Transaksi tetap ada, hanya data reimbursement yang dihapus.`,
      confirmLabel: 'Hapus',
      cancelLabel: 'Batal',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/reimbursements/${reimbursement.id}`, {
            method: 'DELETE',
          })

          if (!res.ok) {
            showError('Gagal menghapus reimbursement')
            return
          }

          showSuccess('Reimbursement berhasil dihapus!')
          fetchReimbursements()
        } catch (error) {
          console.error('Error deleting reimbursement:', error)
          showError('Gagal menghapus reimbursement')
        }
      },
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validate
      if (!formData.officeCategoryId || !formData.description || !formData.amount) {
        showError('Mohon lengkapi semua field yang wajib')
        setLoading(false)
        return
      }

      const amount = parseFloat(formData.amount)
      if (isNaN(amount) || amount <= 0) {
        showError('Jumlah harus berupa angka positif')
        setLoading(false)
        return
      }

      // Create reimbursement (akan auto-create transaction di backend)
      const res = await fetch('/api/reimbursements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date: formData.date,
          officeCategoryId: parseInt(formData.officeCategoryId),
          description: formData.description,
          amount,
          notes: formData.notes,
          receiptPhoto: formData.receiptPhoto || null
        })
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || 'Failed to create reimbursement')
      }

      showSuccess('Reimbursement berhasil ditambahkan!')
      setIsFormOpen(false)
      setFormData({
        date: new Date().toISOString().split('T')[0],
        officeCategoryId: '',
        description: '',
        amount: '',
        notes: '',
        receiptPhoto: ''
      })
      fetchReimbursements()
    } catch (error: any) {
      showError(error.message || 'Gagal menambahkan reimbursement')
    } finally {
      setLoading(false)
    }
  }

  // Calculate summary
  const totalPending = reimbursements
    .filter(r => r.status === 'pending')
    .reduce((sum, r) => sum + r.transaction.expense, 0)

  const totalClaimed = reimbursements
    .filter(r => r.status === 'claimed')
    .reduce((sum, r) => sum + r.transaction.expense, 0)

  const totalAll = reimbursements.reduce((sum, r) => sum + r.transaction.expense, 0)

  // Group by category
  const byCategory = reimbursements.reduce((acc, r) => {
    const catName = r.officeCategory.name
    if (!acc[catName]) {
      acc[catName] = { total: 0, count: 0, icon: r.officeCategory.icon }
    }
    acc[catName].total += r.transaction.expense
    acc[catName].count += 1
    return acc
  }, {} as Record<string, { total: number; count: number; icon: string | null }>)

  const pendingReimbursements = reimbursements.filter(r => r.status === 'pending')
  const claimedReimbursements = reimbursements.filter(r => r.status === 'claimed')

  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Kembali
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
              🏢 Reimbursement Kantor
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Kelola pengeluaran kantor yang perlu direimburs
            </p>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setIsFormOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
            >
              ➕ Tambah Reimbursement
            </button>
            <button
              onClick={() => {/* TODO: Export */}}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
            >
              📄 Export Laporan
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Month Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Bulan
              </label>
              <select
                value={filters.month}
                onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                {months.map((month, idx) => (
                  <option key={idx} value={idx + 1}>{month}</option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tahun
              </label>
              <input
                type="number"
                value={filters.year}
                onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Semua Status</option>
                <option value="pending">Menunggu Dibayar</option>
                <option value="claimed">Sudah Dibayar</option>
              </select>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Menunggu Dibayar</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalPending)}</p>
                <p className="text-xs opacity-75 mt-1">{pendingReimbursements.length} item</p>
              </div>
              <div className="text-4xl">⏳</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Sudah Dibayar</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalClaimed)}</p>
                <p className="text-xs opacity-75 mt-1">{claimedReimbursements.length} item</p>
              </div>
              <div className="text-4xl">✅</div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-400 to-indigo-500 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Total Periode</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(totalAll)}</p>
                <p className="text-xs opacity-75 mt-1">{reimbursements.length} item</p>
              </div>
              <div className="text-4xl">💰</div>
            </div>
          </div>
        </div>

        {/* Will continue with breakdown and list in next part */}

        {/* Breakdown by Category */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            📊 Breakdown per Kategori
          </h2>
          
          {Object.keys(byCategory).length === 0 ? (
            <p className="text-center text-gray-500 py-8">Belum ada data</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(byCategory).map(([name, data]) => (
                <div
                  key={name}
                  className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">{data.icon || '📦'}</span>
                    <span className="font-semibold text-gray-800 dark:text-white text-sm">
                      {name}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                    {formatCurrency(data.total)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {data.count} transaksi
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reimbursement List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
            📋 Daftar Reimbursement
          </h2>

          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading...</p>
          ) : reimbursements.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-6xl mb-4">📭</p>
              <p className="text-gray-500 dark:text-gray-400">
                Belum ada reimbursement untuk periode ini
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Buat transaksi dengan kategori "Reimbursement Kantor" untuk mulai tracking
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {reimbursements.map((reimb) => (
                <div
                  key={reimb.id}
                  className={`border rounded-lg p-4 ${
                    reimb.status === 'claimed'
                      ? 'bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-800'
                      : 'bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Left: Details */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{reimb.officeCategory.icon || '📦'}</span>
                        <div>
                          <p className="font-semibold text-gray-800 dark:text-white">
                            {reimb.transaction.description}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {reimb.officeCategory.name} • {formatDate(reimb.transaction.date)}
                          </p>
                        </div>
                      </div>

                      {reimb.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 ml-10">
                          💬 {reimb.notes}
                        </p>
                      )}

                      {reimb.receiptPhoto && (
                        <div className="ml-10 mt-2">
                          <a
                            href={reimb.receiptPhoto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                          >
                            📎 Lihat Bukti Nota
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Right: Amount & Actions */}
                    <div className="text-right">
                      <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mb-2">
                        {formatCurrency(reimb.transaction.expense)}
                      </p>
                      
                      <div className="flex items-center gap-2 mb-2">
                        {reimb.status === 'pending' ? (
                          <span className="text-xs bg-yellow-500 text-white px-2 py-1 rounded">
                            ⏳ Pending
                          </span>
                        ) : (
                          <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
                            ✅ Dibayar
                          </span>
                        )}
                      </div>

                      <div className="flex gap-2">
                        {reimb.status === 'pending' && (
                          <button
                            onClick={() => handleMarkAsClaimed(reimb)}
                            className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                          >
                            ✓ Tandai Dibayar
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDelete(reimb)}
                          className="text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                        >
                          🗑️ Hapus
                        </button>
                      </div>

                      {reimb.claimedAt && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          Dibayar: {formatDate(reimb.claimedAt)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Form Modal */}
      {isFormOpen && (
        <div
          className="fixed inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setIsFormOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-slideInRight"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">
                ➕ Tambah Reimbursement
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                {/* Office Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Kategori Kantor <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.officeCategoryId}
                    onChange={(e) => setFormData({ ...formData, officeCategoryId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="">Pilih Kategori...</option>
                    {reimbursementCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Deskripsi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Contoh: Pembelian ATK untuk meeting"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jumlah (Rp) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="0"
                    min="0"
                    step="1000"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>

                {/* Receipt Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Foto Nota (opsional)
                  </label>
                  <ImageUpload
                    currentImage={formData.receiptPhoto}
                    onUploadSuccess={(url) => setFormData({ ...formData, receiptPhoto: url })}
                    onUploadError={(error) => showError(error)}
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Keterangan Tambahan (opsional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Catatan tambahan..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                  >
                    {loading ? 'Menyimpan...' : '💾 Simpan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFormOpen(false)}
                    className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
