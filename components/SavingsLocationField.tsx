'use client'

import { useState, useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'

interface SavingsLocationFieldProps {
  value: string
  onChange: (value: string) => void
  required?: boolean
  className?: string
}

export default function SavingsLocationField({
  value,
  onChange,
  required = false,
  className = ''
}: SavingsLocationFieldProps) {
  const { showError } = useNotification()
  const [locations, setLocations] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLocations()
  }, [])

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/settings/savings-locations')
      const data = await res.json()
      setLocations(data.locations || [])
    } catch (error) {
      console.error('Error fetching savings locations:', error)
      showError('Gagal memuat lokasi tabungan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={`bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
        <span>💎</span>
        <span>Lokasi Tabungan</span>
      </div>

      {/* Location Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Simpan di {required && <span className="text-red-500">*</span>}
        </label>
        {loading ? (
          <div className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
            Memuat lokasi...
          </div>
        ) : (
          <select
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="">Pilih Lokasi (Opsional)</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        )}
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Track tabungan di bank/dompet mana
        </p>
      </div>
    </div>
  )
}
