'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { useNotification } from '@/contexts/NotificationContext'
import ReimbursementFormFields from '@/components/ReimbursementFormFields'

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
  income: number
  expense: number
  balance: number | null
  savingsLocation: string | null
  category: Category
}

export default function TransaksiPage() {
  const { showSuccess, showError, confirm } = useNotification()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [savingsLocations, setSavingsLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    categoryId: '',
    description: '',
    type: 'expense',
    amount: '',
    savingsLocation: '',
    // Reimbursement fields
    officeCategoryId: '',
    receiptPhoto: '',
    notes: '',
  })

  // Filters
  const [filters, setFilters] = useState({
    type: '',
    categoryId: '',
    search: '',
  })

  useEffect(() => {
    fetchCategories()
    fetchSavingsLocations()
    fetchTransactions()
  }, [filters])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories')
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchSavingsLocations = async () => {
    try {
      const res = await fetch('/api/settings/savings-locations')
      const data = await res.json()
      setSavingsLocations(data.locations || [])
    } catch (error) {
      console.error('Error fetching savings locations:', error)
    }
  }

  const fetchTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filters.type) params.append('type', filters.type)
      if (filters.categoryId) params.append('categoryId', filters.categoryId)
      if (filters.search) params.append('search', filters.search)

      const res = await fetch(`/api/transactions?${params}`)
      const data = await res.json()
      setTransactions(data)
    } catch (error) {
      console.error('Error fetching transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check if this is a reimbursement transaction
    const selectedCategory = categories.find(c => c.id === parseInt(formData.categoryId))
    const isReimbursement = selectedCategory?.name === 'Reimbursement Kantor'

    try {
      if (isReimbursement) {
        // Validate reimbursement fields
        if (!formData.officeCategoryId) {
          showError('Mohon pilih kategori kantor untuk reimbursement')
          return
        }

        // Create or update reimbursement
        const reimbursementPayload = {
          date: formData.date,
          officeCategoryId: parseInt(formData.officeCategoryId),
          description: formData.description,
          amount: parseFloat(formData.amount),
          notes: formData.notes || null,
          receiptPhoto: formData.receiptPhoto || null,
        }

        if (editingId) {
          showError('Edit reimbursement belum didukung. Hapus dan buat baru.')
          return
        }

        const res = await fetch('/api/reimbursements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reimbursementPayload),
        })

        if (!res.ok) {
          const error = await res.json()
          showError(error.error || 'Gagal menyimpan reimbursement')
          return
        }

        showSuccess('Reimbursement berhasil ditambahkan!')
      } else {
        // Regular transaction
        const payload = {
          date: formData.date,
          categoryId: parseInt(formData.categoryId),
          description: formData.description,
          income: formData.type === 'income' ? parseFloat(formData.amount) : 0,
          expense: formData.type === 'expense' ? parseFloat(formData.amount) : 0,
          savingsLocation: formData.savingsLocation || null,
        }

        if (editingId) {
          // Update
          const res = await fetch(`/api/transactions/${editingId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

          if (!res.ok) {
            showError('Gagal mengupdate transaksi')
            return
          }

          showSuccess('Transaksi berhasil diupdate!')
        } else {
          // Create
          const res = await fetch('/api/transactions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })

          if (!res.ok) {
            showError('Gagal menyimpan transaksi')
            return
          }

          showSuccess('Transaksi berhasil ditambahkan!')
        }
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        categoryId: '',
        description: '',
        type: 'expense',
        amount: '',
        savingsLocation: '',
        officeCategoryId: '',
        receiptPhoto: '',
        notes: '',
      })
      setIsFormOpen(false)
      setEditingId(null)
      fetchTransactions()
    } catch (error) {
      console.error('Error saving:', error)
      showError('Gagal menyimpan transaksi')
    }
  }

  const handleEdit = (transaction: Transaction) => {
    setEditingId(transaction.id)
    setFormData({
      date: new Date(transaction.date).toISOString().split('T')[0],
      categoryId: transaction.categoryId.toString(),
      description: transaction.description,
      type: transaction.income > 0 ? 'income' : 'expense',
      amount: (transaction.income > 0 ? transaction.income : transaction.expense).toString(),
      savingsLocation: transaction.savingsLocation || '',
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (id: number) => {
    confirm({
      title: 'Hapus Transaksi',
      message: 'Yakin ingin menghapus transaksi ini? Data yang dihapus tidak dapat dikembalikan.',
      confirmLabel: 'Hapus',
      cancelLabel: 'Batal',
      confirmVariant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' })
          
          if (!res.ok) {
            showError('Gagal menghapus transaksi')
            return
          }

          showSuccess('Transaksi berhasil dihapus!')
          fetchTransactions()
        } catch (error) {
          console.error('Error deleting transaction:', error)
          showError('Gagal menghapus transaksi')
        }
      }
    })
  }

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')
  const currentCategories = formData.type === 'income' ? incomeCategories : expenseCategories

  // Check if selected category is savings-related
  const selectedCategory = categories.find(c => c.id === parseInt(formData.categoryId))
  const isSavingsCategory = selectedCategory?.name === 'Tabungan' || 
                           selectedCategory?.name === 'Penarikan Tabungan' ||
                           selectedCategory?.name === 'Bunga Tabungan'
  
  // Check if selected category is reimbursement
  const isReimbursementCategory = selectedCategory?.name === 'Reimbursement Kantor'

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">💰 Transaksi</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Kelola pemasukan dan pengeluaran
            </p>
          </div>
          <button
            onClick={() => {
              setIsFormOpen(true)
              setEditingId(null)
              setFormData({
                date: new Date().toISOString().split('T')[0],
                categoryId: '',
                description: '',
                type: 'expense',
                amount: '',
                savingsLocation: '',
                officeCategoryId: '',
                receiptPhoto: '',
                notes: '',
              })
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
          >
            + Tambah Transaksi
          </button>
        </div>

        {/* Form Modal */}
        {isFormOpen && (
          <div 
            className="fixed inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => {
              setIsFormOpen(false)
              setEditingId(null)
            }}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                  {editingId ? 'Edit Transaksi' : 'Tambah Transaksi'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tanggal
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipe
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'income', categoryId: '' })}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          formData.type === 'income'
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        📈 Pemasukan
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'expense', categoryId: '' })}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          formData.type === 'expense'
                            ? 'bg-red-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        📉 Pengeluaran
                      </button>
                    </div>
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Kategori
                    </label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Pilih Kategori</option>
                      {currentCategories.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Savings Location - Show only for savings categories */}
                  {isSavingsCategory && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        💎 Lokasi Tabungan
                      </label>
                      <select
                        value={formData.savingsLocation}
                        onChange={(e) => setFormData({ ...formData, savingsLocation: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Pilih Lokasi (Opsional)</option>
                        {savingsLocations.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Track tabungan di bank/dompet mana
                      </p>
                    </div>
                  )}

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Keterangan
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="Contoh: Gaji bulan Oktober"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Jumlah (Rp)
                    </label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                      placeholder="0"
                    />
                  </div>

                  {/* Reimbursement Fields - Show only when Reimbursement Kantor category selected */}
                  {isReimbursementCategory && (
                    <ReimbursementFormFields
                      officeCategoryId={formData.officeCategoryId}
                      receiptPhoto={formData.receiptPhoto}
                      notes={formData.notes}
                      onOfficeCategoryChange={(value) => setFormData({ ...formData, officeCategoryId: value })}
                      onReceiptPhotoChange={(value) => setFormData({ ...formData, receiptPhoto: value })}
                      onNotesChange={(value) => setFormData({ ...formData, notes: value })}
                      required={true}
                    />
                  )}

                  {/* Buttons */}
                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormOpen(false)
                        setEditingId(null)
                      }}
                      className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                    >
                      {editingId ? 'Update' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter Tipe
              </label>
              <select
                value={filters.type}
                onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">Semua</option>
                <option value="income">Pemasukan</option>
                <option value="expense">Pengeluaran</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Filter Kategori
              </label>
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="">Semua Kategori</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cari
              </label>
              <input
                type="text"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Cari keterangan..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Tanggal
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Kategori
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Keterangan
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Pemasukan
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Pengeluaran
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Saldo
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      Loading...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      <div className="text-4xl mb-2">📝</div>
                      <p>Belum ada transaksi</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {formatDate(transaction.date)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-flex items-center gap-1">
                          <span>{transaction.category.icon}</span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {transaction.category.name}
                          </span>
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                        {transaction.description}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {transaction.income > 0 ? (
                          <span className="text-green-600 font-semibold">
                            {formatCurrency(transaction.income)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        {transaction.expense > 0 ? (
                          <span className="text-red-600 font-semibold">
                            {formatCurrency(transaction.expense)}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right">
                        <span className="font-semibold text-gray-700 dark:text-gray-300">
                          {formatCurrency(transaction.balance || 0)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleEdit(transaction)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(transaction.id)}
                            className="text-red-600 hover:text-red-800 font-medium"
                          >
                            Hapus
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
