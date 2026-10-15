'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import { useNotification } from '@/contexts/NotificationContext'

interface CompanyProfile {
  id: number
  name: string
  logoPath: string | null
  isDefault: boolean
}

interface ExportConfig {
  companyId: number | null
  companyName: string
  companyLogo: string | null
  requestorName: string
  includeApproval: boolean
  startDate: string
  endDate: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
  onExport: (config: ExportConfig, format: 'excel' | 'pdf') => void
  onManageCompanies: () => void
  startDate: Date
  endDate: Date
}

export default function ExportModal({ isOpen, onClose, onExport, onManageCompanies, startDate, endDate }: Props) {
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const { showNotification } = useNotification()
  
  // Form state
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [requestorName, setRequestorName] = useState('')
  const [includeApproval, setIncludeApproval] = useState(false)

  // Load companies on mount
  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load companies
      const companiesRes = await fetch('/api/companies')
      if (companiesRes.ok) {
        const companiesData = await companiesRes.json()
        setCompanies(companiesData)
        
        // Auto-select default company
        const defaultCompany = companiesData.find((c: CompanyProfile) => c.isDefault)
        if (defaultCompany) {
          setSelectedCompanyId(defaultCompany.id)
        }
      }

      // Load saved config from localStorage
      const savedConfig = localStorage.getItem('exportConfig')
      if (savedConfig) {
        try {
          const config = JSON.parse(savedConfig)
          setRequestorName(config.requestorName || '')
          setIncludeApproval(config.includeApproval || false)
        } catch (e) {
          console.error('Failed to parse saved config:', e)
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = (format: 'excel' | 'pdf') => {
    // Validation
    if (!selectedCompanyId) {
      showNotification({ type: 'error', message: 'Pilih perusahaan terlebih dahulu' })
      return
    }

    if (!requestorName.trim()) {
      showNotification({ type: 'error', message: 'Nama pengaju harus diisi' })
      return
    }

    const selectedCompany = companies.find(c => c.id === selectedCompanyId)
    if (!selectedCompany) {
      showNotification({ type: 'error', message: 'Perusahaan tidak ditemukan' })
      return
    }


    // Build config
    const config: ExportConfig = {
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      companyLogo: selectedCompany.logoPath,
      requestorName,
      includeApproval,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }

    // Save to localStorage for next time
    localStorage.setItem('exportConfig', JSON.stringify({
      requestorName,
      includeApproval
    }))

    onExport(config, format)
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Konfirmasi Export">
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <>
            {/* Company Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pilih Perusahaan <span className="text-red-500">*</span>
              </label>
              
              {companies.length === 0 ? (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-lg">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                    Belum ada perusahaan tersimpan
                  </p>
                  <button
                    onClick={() => {
                      onClose()
                      onManageCompanies()
                    }}
                    className="text-sm bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded"
                  >
                    ➕ Tambah Perusahaan
                  </button>
                </div>
              ) : (
                <>
                  <select
                    value={selectedCompanyId || ''}
                    onChange={(e) => setSelectedCompanyId(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">-- Pilih Perusahaan --</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name} {company.isDefault ? '⭐' : ''}
                      </option>
                    ))}
                  </select>

                  {/* Logo Preview */}
                  {selectedCompany && selectedCompany.logoPath && (
                    <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Logo Preview:</p>
                      <img
                        src={selectedCompany.logoPath}
                        alt={selectedCompany.name}
                        className="h-16 object-contain"
                      />
                    </div>
                  )}

                  {/* Manage Companies Link */}
                  <button
                    onClick={() => {
                      onClose()
                      onManageCompanies()
                    }}
                    className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 mt-2"
                  >
                    🏢 Kelola Perusahaan
                  </button>
                </>
              )}
            </div>

            {/* Requestor Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Pengaju <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={requestorName}
                onChange={(e) => setRequestorName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                placeholder="Nama Anda"
              />
            </div>

            {/* Period Summary (replaces month selector) */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Periode Export
              </label>
              <p className="text-base font-semibold text-blue-700 dark:text-blue-300">
                {startDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                {' '} - {' '}
                {endDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                Sesuaikan periode di halaman utama jika perlu
              </p>
            </div>

            {/* Approval Section Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeApproval"
                checked={includeApproval}
                onChange={(e) => setIncludeApproval(e.target.checked)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <label htmlFor="includeApproval" className="text-sm text-gray-700 dark:text-gray-300">
                Tampilkan bagian approval (tanda tangan)
              </label>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => handleExport('excel')}
                disabled={loading || companies.length === 0}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                📥 Export Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={loading || companies.length === 0}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                📄 Export PDF
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(amount)
}
