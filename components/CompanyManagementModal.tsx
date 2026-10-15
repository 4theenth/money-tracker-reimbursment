'use client'

import { useState, useEffect } from 'react'
import Modal from './Modal'
import AddCompanyModal from './AddCompanyModal'
import ConfirmDialog from './ConfirmDialog'
import { useNotification } from '@/contexts/NotificationContext'

interface CompanyProfile {
  id: number
  name: string
  logoPath: string | null
  isDefault: boolean
  createdAt: string
}

interface Props {
  isOpen: boolean
  onClose: () => void
}

export default function CompanyManagementModal({ isOpen, onClose }: Props) {
  const [companies, setCompanies] = useState<CompanyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; name: string } | null>(null)
  const { showSuccess, showError } = useNotification()

  useEffect(() => {
    if (isOpen) {
      loadCompanies()
    }
  }, [isOpen])

  const loadCompanies = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/companies')
      if (res.ok) {
        const data = await res.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error('Failed to load companies:', error)
      showError('Gagal memuat data perusahaan')
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (companyId: number) => {
    try {
      const res = await fetch(`/api/companies/${companyId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true })
      })

      if (res.ok) {
        showSuccess('Default perusahaan berhasil diubah')
        loadCompanies()
      } else {
        throw new Error('Gagal update default')
      }
    } catch (error) {
      console.error('Error setting default:', error)
      showError('Gagal mengubah default perusahaan')
    }
  }

  const handleDelete = async (companyId: number, companyName: string) => {
    // Show confirmation dialog instead of browser confirm
    setConfirmDelete({ id: companyId, name: companyName })
  }

  const confirmDeleteAction = async () => {
    if (!confirmDelete) return

    try {
      const res = await fetch(`/api/companies/${confirmDelete.id}`, {
        method: 'DELETE'
      })

      if (res.ok) {
        showSuccess('Perusahaan berhasil dihapus')
        loadCompanies()
      } else {
        throw new Error('Gagal hapus perusahaan')
      }
    } catch (error) {
      console.error('Error deleting company:', error)
      showError('Gagal menghapus perusahaan')
    } finally {
      setConfirmDelete(null)
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Kelola Perusahaan">
        <div className="space-y-4">
          {/* Add Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold transition-colors"
          >
            ➕ Tambah Perusahaan Baru
          </button>

          {/* Company List */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Belum ada perusahaan tersimpan</p>
              <p className="text-sm text-gray-400 mt-2">Klik tombol di atas untuk menambah</p>
            </div>
          ) : (
            <div className="space-y-3">
              {companies.map((company) => (
                <div
                  key={company.id}
                  className={`border rounded-lg p-4 ${
                    company.isDefault
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    {/* Logo + Name */}
                    <div className="flex items-center gap-3 flex-1">
                      {company.logoPath ? (
                        <img
                          src={company.logoPath}
                          alt={company.name}
                          className="h-12 w-12 object-contain rounded"
                        />
                      ) : (
                        <div className="h-12 w-12 bg-gray-200 dark:bg-gray-600 rounded flex items-center justify-center text-gray-400">
                          🏢
                        </div>
                      )}
                      
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {company.name}
                          {company.isDefault && (
                            <span className="ml-2 text-yellow-500">⭐</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(company.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      {!company.isDefault && (
                        <button
                          onClick={() => handleSetDefault(company.id)}
                          className="text-xs bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                          title="Jadikan default"
                        >
                          ⭐ Set Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(company.id, company.name)}
                        className="text-xs bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        title="Hapus"
                      >
                        🗑️ Hapus
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Add Company Modal */}
      <AddCompanyModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={loadCompanies}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        title="Konfirmasi Hapus"
        message={`Hapus perusahaan "${confirmDelete?.name}"?`}
        confirmText="Hapus"
        cancelText="Batal"
        onConfirm={confirmDeleteAction}
        onCancel={() => setConfirmDelete(null)}
      />
    </>
  )
}
