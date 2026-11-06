'use client'

import { useState, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'

interface SavingsLocationFieldProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
  type?: 'income' | 'expense' | string
  isSaving?: boolean
}

export default function SavingsLocationField({
  value,
  onChange,
  required = false,
  className = '',
  type = 'expense',
  isSaving = false,
}: SavingsLocationFieldProps) {
  const { showSuccess, showError } = useNotification()
  const [locations, setLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newLocationName, setNewLocationName] = useState('')
  const [savingNew, setSavingNew] = useState(false)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/settings/savings-locations')
      const data = await res.json()
      const locs: string[] = data.locations || ['Tunai / Dompet', 'Bank BCA', 'Bank BRI']
      setLocations(locs)
      
      // Auto-set default if empty
      if (!value && locs.length > 0) {
        onChange(locs[0])
      }
    } catch (error) {
      console.error('Error fetching savings locations:', error)
      showError('Gagal memuat daftar rekening/sumber dana')
    } finally {
      setLoading(false)
    }
  }

  const handleAddNewLocation = async () => {
    if (!newLocationName.trim()) {
      showError('Nama rekening/sumber dana tidak boleh kosong')
      return
    }

    const trimmed = newLocationName.trim()
    setSavingNew(true)
    try {
      const res = await fetch('/api/settings/savings-locations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ location: trimmed }),
      })

      if (!res.ok) {
        throw new Error('Gagal menyimpan rekening baru')
      }

      const data = await res.json()
      setLocations(data.locations)
      onChange(trimmed)
      setNewLocationName('')
      setIsAddingNew(false)
      showSuccess(`Rekening "${trimmed}" berhasil ditambahkan!`)
    } catch (error: any) {
      console.error('Error adding location:', error)
      showError(error.message || 'Gagal menambahkan rekening baru')
    } finally {
      setSavingNew(false)
    }
  }

  // Visual text based on transaction mode
  const title = isSaving 
    ? '💎 Lokasi Tabungan' 
    : type === 'income' 
    ? '📥 Rekening / Dompet Penerima' 
    : '💳 Sumber Dana / Pembayaran'

  const label = isSaving 
    ? 'Simpan ke Rekening / Dompet' 
    : type === 'income' 
    ? 'Uang Masuk ke' 
    : 'Dibayar Menggunakan'

  const helperText = isSaving
    ? 'Tabungan akan dialokasikan ke rekening ini'
    : type === 'income'
    ? 'Pilih rekening/dompet penerima pemasukan'
    : 'Pilih rekening/uang tunai yang digunakan (misal: QRIS BCA, transfer BRI, Tunai)'

  const getAccountIcon = (name: string) => {
    if (name.toLowerCase().includes('tunai') || name.toLowerCase().includes('dompet')) return '💵'
    if (name.toLowerCase().includes('bca')) return '🏦'
    if (name.toLowerCase().includes('bri')) return '🏦'
    if (name.toLowerCase().includes('mandiri') || name.toLowerCase().includes('bni') || name.toLowerCase().includes('bank')) return '🏦'
    if (name.toLowerCase().includes('gopay') || name.toLowerCase().includes('ovo') || name.toLowerCase().includes('dana') || name.toLowerCase().includes('shopee')) return '📱'
    return '💳'
  }

  return (
    <div className={`bg-status-info-light bg-status-info-light border border-accent/30 p-4 rounded-lg space-y-3 ${className}`}>
      {/* Header with Title & Add button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-accent font-semibold text-sm">
          <span>{title}</span>
        </div>
        {!isAddingNew && (
          <button
            type="button"
            onClick={() => setIsAddingNew(true)}
            className="text-xs text-accent hover:underline font-medium flex items-center gap-1"
          >
            + Tambah Rekening
          </button>
        )}
      </div>

      {/* Inline Add New Form */}
      {isAddingNew && (
        <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-accent/30 space-y-2">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
            Nama Rekening / Akun Baru <span className="text-status-danger font-bold">*</span>:
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newLocationName}
              onChange={(e) => setNewLocationName(e.target.value)}
              placeholder="Contoh: Bank Jago, Gopay, dll"
              className="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-1 focus:ring-accent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddNewLocation()
                }
              }}
            />
            <button
              type="button"
              onClick={handleAddNewLocation}
              disabled={savingNew}
              className="px-3 py-1.5 bg-brand-primary hover:bg-brand-primary-hover text-white text-xs font-medium rounded-lg disabled:opacity-50"
            >
              {savingNew ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddingNew(false)
                setNewLocationName('')
              }}
              className="px-2.5 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 text-gray-700 dark:text-gray-300 text-xs font-medium rounded-lg"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* Location Select */}
      <div>
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label} {required ? <span className="text-status-danger font-bold">*</span> : <span className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">(Default: Tunai / Dompet)</span>}
        </label>
        {loading ? (
          <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
            Memuat daftar rekening...
          </div>
        ) : (
          <select
            value={value || (locations[0] || 'Tunai / Dompet')}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent dark:bg-gray-800 dark:text-white text-sm font-medium"
          >
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {getAccountIcon(loc)} {loc}
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {helperText}
        </p>
      </div>
    </div>
  )
}
