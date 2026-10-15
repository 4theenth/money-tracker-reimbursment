'use client'

import { useState } from 'react'
import Modal from './Modal'
import { useNotification } from '@/contexts/NotificationContext'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function AddCompanyModal({ isOpen, onClose, onSuccess }: Props) {
  const { showSuccess, showError } = useNotification()
  const [name, setName] = useState('')
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [isDefault, setIsDefault] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('=== FORM SUBMIT START ===')
    console.log('Form values:', { name, logoFile: logoFile?.name, isDefault })

    if (!name.trim()) {
      showError('Nama perusahaan harus diisi')
      return
    }

    setSaving(true)

    try {
      let logoPath = null

      // Upload logo if provided
      if (logoFile) {
        const formData = new FormData()
        formData.append('logo', logoFile)

        const uploadRes = await fetch('/api/companies/upload-logo', {
          method: 'POST',
          body: formData
        })

        if (!uploadRes.ok) {
          const uploadError = await uploadRes.json()
          console.error('Upload error:', uploadError)
          throw new Error(uploadError.error || 'Gagal upload logo')
        }

        const uploadData = await uploadRes.json()
        logoPath = uploadData.path
      }

      // Create company
      const createRes = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          logoPath,
          isDefault
        })
      })

      if (!createRes.ok) {
        const createError = await createRes.json()
        console.error('Create company error:', createError)
        console.error('Request body was:', { name, logoPath, isDefault })
        throw new Error(createError.error || 'Gagal menyimpan perusahaan')
      }

      const newCompany = await createRes.json()
      console.log('Company created successfully:', newCompany)

      // Success
      showSuccess(`Perusahaan "${name}" berhasil disimpan!`)
      setName('')
      setLogoFile(null)
      setLogoPreview(null)
      setIsDefault(false)
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Error saving company:', error)
      showError(error.message || 'Gagal menyimpan perusahaan')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      setName('')
      setLogoFile(null)
      setLogoPreview(null)
      setIsDefault(false)
      onClose()
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Tambah Perusahaan">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Company Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Nama Perusahaan <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
            placeholder="PT Contoh Perusahaan"
            disabled={saving}
            required
          />
        </div>

        {/* Logo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Logo Perusahaan <span className="text-gray-500 text-xs">(Opsional)</span>
          </label>
          
          {/* Custom Upload Button */}
          <div className="space-y-3">
            {!logoPreview ? (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <svg className="w-10 h-10 mb-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    <span className="font-semibold">Klik untuk upload</span> atau drag & drop
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WebP (Max 5MB)</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  disabled={saving}
                />
              </label>
            ) : (
              <div className="relative">
                <div className="flex items-center justify-center w-full h-32 border-2 border-green-300 dark:border-green-600 rounded-lg bg-gray-50 dark:bg-gray-700 p-3">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLogoFile(null)
                    setLogoPreview(null)
                  }}
                  className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
                  title="Hapus gambar"
                  disabled={saving}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Set as Default */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="setAsDefault"
            checked={isDefault}
            onChange={(e) => setIsDefault(e.target.checked)}
            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            disabled={saving}
          />
          <label htmlFor="setAsDefault" className="text-sm text-gray-700 dark:text-gray-300">
            Jadikan perusahaan default
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-600">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            {saving ? 'Menyimpan...' : '✓ Simpan'}
          </button>
          <button
            type="button"
            onClick={handleClose}
            disabled={saving}
            className="flex-1 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
          >
            Batal
          </button>
        </div>
      </form>
    </Modal>
  )
}
