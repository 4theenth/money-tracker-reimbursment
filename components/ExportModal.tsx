'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import DateRangePicker from './DateRangePicker'
import Select from '@/components/ui/Select'
import { useNotification } from '@/contexts/NotificationContext'
import { formatLocalDate } from '@/lib/utils'

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
  const { showError } = useNotification()
  
  // Form state
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null)
  const [requestorName, setRequestorName] = useState('')
  const [includeApproval, setIncludeApproval] = useState(false)
  // Export period: starts from the page's filter but is edited independently of it
  const [exportStartDate, setExportStartDate] = useState(startDate)
  const [exportEndDate, setExportEndDate] = useState(endDate)

  // Load companies on mount
  useEffect(() => {
    if (isOpen) {
      setExportStartDate(startDate)
      setExportEndDate(endDate)
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
      showError('Pilih perusahaan terlebih dahulu')
      return
    }

    if (!requestorName.trim()) {
      showError('Nama pengaju harus diisi')
      return
    }

    const selectedCompany = companies.find(c => c.id === selectedCompanyId)
    if (!selectedCompany) {
      showError('Perusahaan tidak ditemukan')
      return
    }


    // Build config
    const config: ExportConfig = {
      companyId: selectedCompany.id,
      companyName: selectedCompany.name,
      companyLogo: selectedCompany.logoPath,
      requestorName,
      includeApproval,
      startDate: formatLocalDate(exportStartDate),
      endDate: formatLocalDate(exportEndDate)
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
                Pilih Perusahaan <span className="text-status-danger font-bold">*</span>
              </label>
              
              {companies.length === 0 ? (
                <div className="p-4 bg-status-warning-light border border-gray-200 dark:border-gray-700 rounded-lg">
                  <p className="text-sm text-caution mb-2">
                    Belum ada perusahaan tersimpan
                  </p>
                  <button
                    onClick={() => {
                      onClose()
                      onManageCompanies()
                    }}
                    className="text-sm bg-caution-solid hover:bg-caution-solid-hover text-white px-4 py-2 rounded"
                  >
                    ➕ Tambah Perusahaan
                  </button>
                </div>
              ) : (
                <>
                  <Select
                    value={selectedCompanyId ? selectedCompanyId.toString() : ''}
                    onChange={(val) => setSelectedCompanyId(val ? parseInt(val) : null)}
                    placeholder="-- Pilih Perusahaan --"
                    searchPlaceholder="Cari perusahaan..."
                    options={companies.map((company) => ({
                      value: company.id.toString(),
                      label: `${company.name}${company.isDefault ? ' ⭐' : ''}`,
                      icon: '🏢',
                    }))}
                  />

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
                    className="text-xs text-accent hover:text-accent-hover mt-2"
                  >
                    🏢 Kelola Perusahaan
                  </button>
                </>
              )}
            </div>

            {/* Requestor Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nama Pengaju <span className="text-status-danger font-bold">*</span>
              </label>
              <input
                type="text"
                value={requestorName}
                onChange={(e) => setRequestorName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-accent dark:bg-gray-700 dark:text-white"
                placeholder="Nama Anda"
              />
            </div>

            {/* Export Period */}
            <div className="bg-status-info-light border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Periode Export
              </p>
              <DateRangePicker
                startDate={exportStartDate}
                endDate={exportEndDate}
                onStartDateChange={setExportStartDate}
                onEndDateChange={setExportEndDate}
                onQuickFilter={(start, end) => {
                  setExportStartDate(start)
                  setExportEndDate(end)
                }}
                calendarPortalId="export-modal-calendar"
              />
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                Hanya berlaku untuk export ini, filter di halaman utama tidak berubah
              </p>
            </div>

            {/* Approval Section Toggle */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="includeApproval"
                checked={includeApproval}
                onChange={(e) => setIncludeApproval(e.target.checked)}
                className="w-4 h-4 accent-[var(--color-accent)] border-gray-300 rounded focus:ring-accent"
              />
              <label htmlFor="includeApproval" className="text-sm text-gray-700 dark:text-gray-300">
                Tampilkan bagian approval (tanda tangan) <span className="text-xs text-gray-500 dark:text-gray-400 font-normal">(Opsional)</span>
              </label>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
              <button
                onClick={() => handleExport('excel')}
                disabled={loading || companies.length === 0}
                className="flex-1 bg-income-solid hover:bg-income-solid-hover disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                📥 Export Excel
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={loading || companies.length === 0}
                className="flex-1 bg-expense-solid hover:bg-expense-solid-hover disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
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
