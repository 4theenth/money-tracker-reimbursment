'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useNotification } from '@/contexts/NotificationContext'
import { formatLocalDate } from '@/lib/utils'
import Modal from '@/components/Modal'
import Select from '@/components/ui/Select'
import DatePickerInput from '@/components/ui/DatePickerInput'
import ReimbursementFormFields from '@/components/ReimbursementFormFields'
import SavingsLocationField from '@/components/SavingsLocationField'

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
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState({
    date: formatLocalDate(new Date()),
    categoryId: '',
    description: '',
    type: 'expense',
    amount: '',
    savingsLocation: 'Tunai / Dompet',
    // Reimbursement fields
    officeCategoryId: '',
    receiptPhoto: '',
    notes: '',
  })

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
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
          savingsLocation: formData.savingsLocation || 'Tunai / Dompet',
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
        date: formatLocalDate(new Date()),
        categoryId: '',
        description: '',
        type: 'expense',
        amount: '',
        savingsLocation: 'Tunai / Dompet',
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
        className="fixed bottom-6 right-6 bg-brand-primary hover:bg-brand-primary-hover text-white p-4 rounded-full shadow-2xl transition-all z-50 flex items-center gap-2"
      >
        <span aria-hidden="true" className="text-2xl leading-none">+</span>
        <span className="font-semibold pr-2">Tambah Cepat</span>
      </button>

      {/* Modal */}
      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Tambah transaksi cepat"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-3">
                  Kolom dengan tanda <span className="text-status-danger font-bold">*</span> wajib diisi
                </p>

                {/* Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tanggal <span className="text-status-danger font-bold">*</span>
                  </label>
                  <DatePickerInput
                    value={formData.date}
                    onChange={(value) => setFormData({ ...formData, date: value })}
                    required
                  />
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipe <span className="text-status-danger font-bold">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'income', categoryId: '' })}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        formData.type === 'income'
                          ? 'bg-income-solid text-white'
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
                          ? 'bg-expense-solid text-white'
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
                    Kategori <span className="text-status-danger font-bold">*</span>
                  </label>
                  <Select
                    value={formData.categoryId}
                    onChange={(value) => setFormData({ ...formData, categoryId: value })}
                    required
                    placeholder="Pilih Kategori"
                    searchPlaceholder="Cari kategori..."
                    options={currentCategories.map((cat) => ({
                      value: cat.id.toString(),
                      label: cat.name,
                      icon: cat.icon,
                    }))}
                  />
                </div>

                {/* Sumber Dana / Rekening Pembayaran */}
                <SavingsLocationField
                  value={formData.savingsLocation || 'Tunai / Dompet'}
                  onChange={(value) => setFormData({ ...formData, savingsLocation: value })}
                  type={formData.type}
                  isSaving={isSavingsCategory}
                  required={false}
                />

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Keterangan <span className="text-status-danger font-bold">*</span>
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:text-white"
                    placeholder="Contoh: Gaji bulan Oktober"
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Jumlah (Rp) <span className="text-status-danger font-bold">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:text-white"
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
                    className="flex-1 px-4 py-2 bg-brand-primary text-white rounded-lg font-medium hover:bg-brand-primary-hover disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : 'Simpan'}
                  </button>
                </div>
              </form>
            </Modal>
    </>
  )
}
