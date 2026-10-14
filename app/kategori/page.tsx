'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNotification } from '@/contexts/NotificationContext'

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

export default function KategoriPage() {
  const { showSuccess, showError, confirm } = useNotification()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    type: 'expense',
    icon: '📦',
    color: '#6b7280',
  })

  // Emoji picker options
  const emojiOptions = [
    '💰', '💵', '💴', '💶', '💷', '💳', '🏦', '💎', 
    '🍔', '🍕', '🍜', '☕', '🍱', '🥗', '🍰', '🍺',
    '🚗', '✈️', '🚌', '🚕', '🚇', '🛵', '🚲', '⛽',
    '🏠', '🏢', '🏨', '🏪', '🏫', '🏥', '⚡', '💡',
    '🎮', '🎬', '🎵', '🎨', '🎯', '⚽', '🏀', '🎾',
    '📚', '📖', '✏️', '📝', '🖊️', '📋', '📌', '📎',
    '❤️', '🙏', '⭐', '🎁', '🎉', '🔔', '📦', '🔧',
  ]

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
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold shadow-lg transition-colors"
          >
            + Tambah Kategori
          </button>
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
                            ? 'bg-green-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        📈 Pemasukan
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'expense' })}
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
                            formData.icon === emoji ? 'bg-blue-100 dark:bg-blue-900' : ''
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
                      className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
                    >
                      Batal
                    </button>
                    <button
                      type="submit"
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
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
                        ? 'bg-green-50 dark:bg-green-900/20'
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
                          <span className="text-xs text-red-600 dark:text-red-400">
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className={`text-sm font-medium ${
                          category.isActive
                            ? 'text-red-600 hover:text-red-700 dark:text-red-400'
                            : 'text-green-600 hover:text-green-700 dark:text-green-400'
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
                        ? 'bg-red-50 dark:bg-red-900/20'
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
                          <span className="text-xs text-red-600 dark:text-red-400">
                            Nonaktif
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(category)}
                        className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        className={`text-sm font-medium ${
                          category.isActive
                            ? 'text-red-600 hover:text-red-700 dark:text-red-400'
                            : 'text-green-600 hover:text-green-700 dark:text-green-400'
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
      </div>
    </div>
  )
}
