'use client'

import { useState, useEffect } from 'react'
import ImageUpload from '@/components/ImageUpload'
import { useNotification } from '@/contexts/NotificationContext'

interface ReimbursementCategory {
  id: number
  name: string
  icon: string | null
}

interface ReimbursementFormFieldsProps {
  // Form data state
  officeCategoryId: string
  receiptPhoto: string
  notes: string
  
  // Change handlers
  onOfficeCategoryChange: (value: string) => void
  onReceiptPhotoChange: (value: string) => void
  onNotesChange: (value: string) => void
  
  // Optional customization
  required?: boolean
  className?: string
}

export default function ReimbursementFormFields({
  officeCategoryId,
  receiptPhoto,
  notes,
  onOfficeCategoryChange,
  onReceiptPhotoChange,
  onNotesChange,
  required = true,
  className = ''
}: ReimbursementFormFieldsProps) {
  const { showError } = useNotification()
  const [categories, setCategories] = useState<ReimbursementCategory[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/reimbursement-categories')
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching reimbursement categories:', error)
      showError('Gagal memuat kategori kantor')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg space-y-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-medium">
        <span>🏢</span>
        <span>Detail Reimbursement</span>
      </div>

      {/* Office Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Kategori Kantor {required && <span className="text-red-500">*</span>}
        </label>
        {loading ? (
          <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            Memuat kategori...
          </div>
        ) : (
          <select
            value={officeCategoryId}
            onChange={(e) => onOfficeCategoryChange(e.target.value)}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Pilih Kategori Kantor</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.icon} {cat.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Receipt Photo Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Foto Nota (opsional)
        </label>
        <ImageUpload
          currentImage={receiptPhoto}
          onUploadSuccess={onReceiptPhotoChange}
          onUploadError={(error) => showError(error)}
        />
        {!receiptPhoto && (
          <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
            ⚠️ Disarankan upload foto nota untuk mempermudah klaim reimbursement
          </p>
        )}
      </div>

      {/* Additional Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Keterangan Tambahan (opsional)
        </label>
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          placeholder="Catatan untuk reimbursement..."
        />
      </div>
    </div>
  )
}
