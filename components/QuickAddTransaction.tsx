'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/contexts/NotificationContext'
import ReimbursementFormFields from '@/components/ReimbursementFormFields'

interface Category {
  id: number
  name: string
  type: string
  icon: string | null
}

interface QuickAddProps {
  onSuccess?: () => void
}

export default function QuickAddTransaction({ onSuccess }: QuickAddProps) {
  const router = useRouter()
  const { showSuccess, showError } = useNotification()
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<Category[]>([])
  const [savingsLocations, setSavingsLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

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

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      fetchSavingsLocations()
    }
  }, [isOpen])

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Check if this is a reimbursement transaction
      if (isReimbursementCategory) {
        // Validate reimbursement fields
        if (!formData.officeCategoryId) {
          showError('Mohon pilih kategori kantor untuk reimbursement')
          setLoading(false)
          return
        }

        // Create reimbursement with auto-transaction
        const reimbursementPayload = {
          date: formData.date,
          officeCategoryId: parseInt(formData.officeCategoryId),
          description: formData.description,
          amount: parseFloat(formData.amount),
          notes: formData.notes || null,
          receiptPhoto: formData.receiptPhoto || null,
        }

        const res = await fetch('/api/reimbursements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reimbursementPayload),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Gagal menyimpan reimbursement')
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

        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })

        if (!res.ok) {
          const error = await res.json()
          throw new Error(error.error || 'Gagal menyimpan transaksi')
        }

        showSuccess('Transaksi berhasil ditambahkan!')
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
      setIsOpen(false)

      // Callback or refresh
      if (onSuccess) {
        onSuccess()
      } else {
        router.refresh()
      }
    } catch (error: any) {
      console.error('Error saving:', error)
      showError(error.message || 'Gagal menyimpan')
    } finally {
      setLoading(false)
    }
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
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-2xl hover:shadow-blue-500/50 transition-all z-50 flex items-center gap-2"
      >
        <span className="text-2xl">➕</span>
        <span className="font-semibold pr-2">Tambah Cepat</span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 flex items-center justify-center z-50 p-4 animate-fadeIn"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                  ➕ Tambah Transaksi Cepat
                </h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                >
                  ×
                </button>
              </div>
              
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
                      onClick={() => setFormData({ ...formData, type: 'income', categoryId: '', savingsLocation: '' })}
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
                      onClick={() => setFormData({ ...formData, type: 'expense', categoryId: '', savingsLocation: '' })}
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
                      <option value="">Pilih Lokasi</option>
                      {savingsLocations.map((loc) => (
                        <option key={loc} value={loc}>
                          {loc}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Opsional: Track tabungan di bank/dompet mana
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
                    onClick={() => setIsOpen(false)}
                    className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                    disabled={loading}
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
