'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNotification } from '@/contexts/NotificationContext'
import { emojiOptions } from '@/lib/config/emojis'

interface Category {
  id: number
  name: string
  type: string
  icon: string | null
  color: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface ReimbursementCategory {
  id: number
  name: string
  icon: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export default function KategoriPage() {
  const { showSuccess, showError, confirm } = useNotification()
  const [categories, setCategories] = useState<Category[]>([])
  const [reimbursementCategories, setReimbursementCategories] = useState<ReimbursementCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [reimbLoading, setReimbLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isReimbFormOpen, setIsReimbFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingReimbId, setEditingReimbId] = useState<number | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    icon: '📦',
    color: '#6b7280',
  })

  // Reimbursement form state
  const [reimbFormData, setReimbFormData] = useState({
    name: '',
    icon: '📦',
  })

  // Emoji picker options (imported from config)
  // Edit emojis via: /admin/emoji-manager

  const colorOptions = [
    { name: 'Hijau', value: '#10b981' },
    { name: 'Merah', value: '#ef4444' },
    { name: 'Biru', value: '#3b82f6' },
    { name: 'Kuning', value: '#eab308' },
    { name: 'Ungu', value: '#8b5cf6' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Orange', value: '#f97316' },
    { name: 'Abu', value: '#6b7280' },
  ]

  useEffect(() => {
    fetchCategories()
    fetchReimbursementCategories()
  }, [showInactive])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const url = showInactive 
        ? '/api/categories?includeInactive=true'
        : '/api/categories'
      const res = await fetch(url)
      const data = await res.json()
      setCategories(data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      showError('Gagal memuat kategori')
    } finally {
      setLoading(false)
    }
  }

  const fetchReimbursementCategories = async () => {
    try {
      setReimbLoading(true)
      const url = showInactive
        ? '/api/reimbursement-categories?includeInactive=true'
        : '/api/reimbursement-categories'
      const res = await fetch(url)
      const data = await res.json()
      setReimbursementCategories(data)
    } catch (error) {
      console.error('Error fetching reimbursement categories:', error)
      showError('Gagal memuat kategori reimbursement')
    } finally {
      setReimbLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        // Update
        const res = await fetch(`/api/categories/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!res.ok) {
          const error = await res.json()
          showError(error.error || 'Gagal update kategori')
          return
        }

        showSuccess('Kategori berhasil diupdate!')
      } else {
        // Create
        const res = await fetch('/api/categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        })

        if (!res.ok) {
          const error = await res.json()
          showError(error.error || 'Gagal tambah kategori')
          return
        }

        showSuccess('Kategori berhasil ditambahkan!')
      }

      // Reset form
      setFormData({
        name: '',
        type: 'expense',
        icon: '📦',
        color: '#6b7280',
      })
      setIsFormOpen(false)
      setEditingId(null)
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      showError('Gagal menyimpan kategori')
    }
  }

  const handleEdit = (category: Category) => {
    setEditingId(category.id)
    setFormData({
      name: category.name,
      type: category.type,
      icon: category.icon || '📦',
      color: category.color || '#6b7280',
    })
    setIsFormOpen(true)
  }

  const handleDelete = async (category: Category) => {
    const action = category.isActive ? 'nonaktifkan' : 'aktifkan kembali'
    const actionPast = category.isActive ? 'dinonaktifkan' : 'diaktifkan'
    
    confirm({
      title: category.isActive ? 'Nonaktifkan Kategori' : 'Aktifkan Kategori',
      message: `Yakin ingin ${action} kategori "${category.name}"?`,
      confirmLabel: category.isActive ? 'Nonaktifkan' : 'Aktifkan',
      cancelLabel: 'Batal',
      confirmVariant: category.isActive ? 'danger' : 'success',
      onConfirm: async () => {
        try {
          if (category.isActive) {
            // Deactivate
            const res = await fetch(`/api/categories/${category.id}`, {
              method: 'DELETE',
            })

            if (!res.ok) {
              const error = await res.json()
              showError(error.error || `Gagal ${action} kategori`)
              return
            }
          } else {
            // Reactivate
            const res = await fetch(`/api/categories/${category.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...category, isActive: true }),
            })

            if (!res.ok) {
              const error = await res.json()
              showError(error.error || `Gagal ${action} kategori`)
              return
            }
          }

          showSuccess(`Kategori "${category.name}" berhasil ${actionPast}!`)
          fetchCategories()
        } catch (error) {
          console.error('Error toggling category:', error)
          showError('Gagal mengubah status kategori')
        }
      },
    })
  }

  // Reimbursement Category Handlers
  const handleReimbSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingReimbId) {
        // Update
        const res = await fetch(`/api/reimbursement-categories/${editingReimbId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reimbFormData),
        })

        if (!res.ok) {
          const error = await res.json()
          showError(error.error || 'Gagal update kategori reimbursement')
          return
        }

        showSuccess('Kategori reimbursement berhasil diupdate!')
      } else {
        // Create
        const res = await fetch('/api/reimbursement-categories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(reimbFormData),
        })

        if (!res.ok) {
          const error = await res.json()
          showError(error.error || 'Gagal tambah kategori reimbursement')
          return
        }

        showSuccess('Kategori reimbursement berhasil ditambahkan!')
      }

      // Reset form
      setReimbFormData({
        name: '',
        icon: '📦',
      })
      setIsReimbFormOpen(false)
      setEditingReimbId(null)
      fetchReimbursementCategories()
    } catch (error) {
      console.error('Error saving reimbursement category:', error)
      showError('Gagal menyimpan kategori reimbursement')
    }
  }

  const handleReimbEdit = (category: ReimbursementCategory) => {
    setEditingReimbId(category.id)
    setReimbFormData({
      name: category.name,
      icon: category.icon || '📦',
    })
    setIsReimbFormOpen(true)
  }

  const handleReimbToggle = async (category: ReimbursementCategory) => {
    const action = category.isActive ? 'nonaktifkan' : 'aktifkan kembali'
    const actionPast = category.isActive ? 'dinonaktifkan' : 'diaktifkan'
    
    confirm({
      title: category.isActive ? 'Nonaktifkan Kategori' : 'Aktifkan Kategori',
      message: `Yakin ingin ${action} kategori \"${category.name}\"?`,
      confirmLabel: category.isActive ? 'Nonaktifkan' : 'Aktifkan',
      cancelLabel: 'Batal',
      confirmVariant: category.isActive ? 'danger' : 'success',
      onConfirm: async () => {
        try {
          if (category.isActive) {
            // Deactivate
            const res = await fetch(`/api/reimbursement-categories/${category.id}`, {
              method: 'DELETE',
            })

            if (!res.ok) {
              const error = await res.json()
              showError(error.error || `Gagal ${action} kategori`)
              return
            }
          } else {
            // Reactivate
            const res = await fetch(`/api/reimbursement-categories/${category.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...category, isActive: true }),
            })

            if (!res.ok) {
              const error = await res.json()
              showError(error.error || `Gagal ${action} kategori`)
              return
            }
          }

          showSuccess(`Kategori \"${category.name}\" berhasil ${actionPast}!`)
          fetchReimbursementCategories()
        } catch (error) {
          console.error('Error toggling reimbursement category:', error)
          showError('Gagal mengubah status kategori')
        }
      },
    })
  }

  const incomeCategories = categories.filter(c => c.type === 'income')
  const expenseCategories = categories.filter(c => c.type === 'expense')

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                ← Kembali
              </Link>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
              🏷️ Kelola Kategori
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Tambah, edit, atau nonaktifkan kategori transaksi
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/admin/emoji-manager"
              className="bg-brand-secondary hover:bg-brand-secondary-hover text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
            >
              🎨 Kelola Emoji
            </Link>
            <button
              onClick={() => {
                setIsFormOpen(true)
                setEditingId(null)
                setFormData({
                  name: '',
                  type: 'expense',
                  icon: '📦',
                  color: '#6b7280',
                })
              }}
              className="bg-brand-primary hover:bg-brand-primary-hover text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
            >
              + Tambah Kategori
            </button>
          </div>
        </div>

        {/* Toggle Inactive */}
        <div className="mb-6">
          <label className="flex items-center gap-2 cursor-pointer w-fit">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Tampilkan kategori nonaktif
            </span>
          </label>
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
                  {editingId ? 'Edit Kategori' : 'Tambah Kategori Baru'}
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nama Kategori *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                      placeholder="Contoh: ATK Kantor"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tipe *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'income' })}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          formData.type === 'income'
                            ? 'bg-status-success text-white'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        📈 Pemasukan
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'expense' })}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          formData.type === 'expense'
                            ? 'bg-status-danger text-white'
                            : 'bg-neutral-200 dark:bg-neutral-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        📉 Pengeluaran
                      </button>
                    </div>
                  </div>

                  {/* Icon */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Icon
                    </label>
                    <div className="grid grid-cols-8 gap-2 max-h-40 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                      {emojiOptions.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: emoji })}
                          className={`text-2xl p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                            formData.icon === emoji ? 'bg-brand-primary/20 dark:bg-brand-primary/30' : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Color */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Warna
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, color: color.value })}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 ${
                            formData.color === color.value
                              ? 'border-blue-600 dark:border-blue-400'
                              : 'border-gray-300 dark:border-gray-600'
                          }`}
                        >
                          <div
                            className="w-6 h-6 rounded"
                            style={{ backgroundColor: color.value }}
                          />
                          <span className="text-xs text-gray-700 dark:text-gray-300">
                            {color.name}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Preview */}
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{formData.icon}</span>
                      <span
                        className="font-semibold"
                        style={{ color: formData.color }}
                      >
                        {formData.name || 'Nama Kategori'}
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300">
                        {formData.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormOpen(false)
                        setEditingId(null)
                      }}
                      className="flex-1 px-4 py-2 bg-action-cancel hover:bg-action-cancel-hover text-white rounded-lg font-medium"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-action-save hover:bg-action-save-hover text-white rounded-lg font-medium"
                    >
                      {editingId ? 'Update' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Categories List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Income Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <span className="text-2xl">📈</span>
                Kategori Pemasukan
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {incomeCategories.filter(c => c.isActive).length} aktif
              </span>
            </div>

            {loading ? (
              <p className="text-center py-8 text-gray-500">Loading...</p>
            ) : incomeCategories.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Belum ada kategori</p>
            ) : (
              <div className="space-y-2">
                {incomeCategories.map((category) => (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      category.isActive
                        ? 'bg-status-success-light'
                        : 'bg-gray-100 dark:bg-gray-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <p
                          className="font-semibold"
                          style={{ color: category.color || '#6b7280' }}
                        >
                          {category.name}
                        </p>
                        {!category.isActive && (
                          <span className="text-xs text-status-danger">
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-brand-primary hover:text-brand-primary-hover text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className={`text-sm font-medium ${
                          category.isActive
                            ? 'text-status-danger hover:text-status-danger'
                            : 'text-status-success hover:text-status-success'
                        }`}
                      >
                        {category.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Expense Categories */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <span className="text-2xl">📉</span>
                Kategori Pengeluaran
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {expenseCategories.filter(c => c.isActive).length} aktif
              </span>
            </div>

            {loading ? (
              <p className="text-center py-8 text-gray-500">Loading...</p>
            ) : expenseCategories.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Belum ada kategori</p>
            ) : (
              <div className="space-y-2">
                {expenseCategories.map((category) => (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      category.isActive
                        ? 'bg-status-danger-light'
                        : 'bg-gray-100 dark:bg-gray-700 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{category.icon}</span>
                      <div>
                        <p
                          className="font-semibold"
                          style={{ color: category.color || '#6b7280' }}
                        >
                          {category.name}
                        </p>
                        {!category.isActive && (
                          <span className="text-xs text-status-danger">
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-brand-primary hover:text-brand-primary-hover text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className={`text-sm font-medium ${
                          category.isActive
                            ? 'text-status-danger hover:text-status-danger'
                            : 'text-status-success hover:text-status-success'
                        }`}
                      >
                        {category.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reimbursement Categories Section */}
        <div className="mt-8">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  <span className="text-3xl">📂</span>
                  Kategori Reimbursement
                </h2>
                <p className="text-purple-100 mt-1">
                  Kelola kategori untuk pengeluaran kantor yang perlu direimburs
                </p>
              </div>
              <button
                onClick={() => {
                  setIsReimbFormOpen(true)
                  setEditingReimbId(null)
                  setReimbFormData({
                    name: '',
                    icon: '📦',
                  })
                }}
                className="bg-brand-secondary/10 hover:bg-brand-secondary/20 text-brand-secondary px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors border-2 border-brand-secondary"
              >
                + Tambah Kategori
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Daftar Kategori
              </h3>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {reimbursementCategories.filter(c => c.isActive).length} aktif
              </span>
            </div>

            {reimbLoading ? (
              <p className="text-center py-8 text-gray-500">Loading...</p>
            ) : reimbursementCategories.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Belum ada kategori reimbursement</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {reimbursementCategories.map((category) => (
                  <div
                    key={category.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      category.isActive
                        ? 'bg-brand-secondary/10 dark:bg-brand-secondary/20 border-brand-secondary/50'
                        : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{category.icon}</span>
                      <div>
                        <p className="font-semibold text-gray-800 dark:text-white">
                          {category.name}
                        </p>
                        {!category.isActive && (
                          <span className="text-xs text-status-danger">
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReimbEdit(category)}
                        className="text-brand-primary hover:text-brand-primary-hover text-sm font-medium"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => handleReimbToggle(category)}
                        className={`text-sm font-medium ${
                          category.isActive
                            ? 'text-status-danger hover:text-status-danger'
                            : 'text-status-success hover:text-status-success'
                        }`}
                        title={category.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {category.isActive ? '🗑️' : '✅'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Reimbursement Category Form Modal */}
        {isReimbFormOpen && (
          <div 
            className="fixed inset-0 backdrop-blur-sm bg-white/30 dark:bg-black/30 flex items-center justify-center z-50 p-4 animate-fadeIn"
            onClick={() => {
              setIsReimbFormOpen(false)
              setEditingReimbId(null)
            }}
          >
            <div 
              className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scaleIn"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
                  {editingReimbId ? 'Edit Kategori Reimbursement' : 'Tambah Kategori Reimbursement'}
                </h2>
                
                <form onSubmit={handleReimbSubmit} className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nama Kategori *
                    </label>
                    <input
                      type="text"
                      value={reimbFormData.name}
                      onChange={(e) => setReimbFormData({ ...reimbFormData, name: e.target.value })}
                      required
                      placeholder="Contoh: Makan & Minum"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>

                  {/* Icon Picker */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Icon
                    </label>
                    <div className="grid grid-cols-8 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                      {emojiOptions.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setReimbFormData({ ...reimbFormData, icon: emoji })}
                          className={`text-2xl p-2 rounded transition-colors ${
                            reimbFormData.icon === emoji
                              ? 'bg-brand-secondary scale-110'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setIsReimbFormOpen(false)
                        setEditingReimbId(null)
                      }}
                      className="flex-1 px-4 py-2 bg-action-cancel hover:bg-action-cancel-hover text-white rounded-lg font-medium"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-action-save hover:bg-action-save-hover text-white rounded-lg font-medium"
                    >
                      {editingReimbId ? 'Update' : 'Simpan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
