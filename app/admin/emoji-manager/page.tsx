'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNotification } from '@/contexts/NotificationContext'

export default function EmojiManagerPage() {
  const { showSuccess, showError, confirm } = useNotification()
  const [emojis, setEmojis] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [newEmoji, setNewEmoji] = useState('')
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  useEffect(() => {
    fetchEmojis()
  }, [])

  const fetchEmojis = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/emojis')
      const data = await res.json()
      
      if (res.ok) {
        setEmojis(data.emojis)
        setHasUnsavedChanges(false) // Reset flag after fetch
      } else {
        showError(data.error || 'Gagal memuat emoji')
      }
    } catch (error) {
      console.error('Error fetching emojis:', error)
      showError('Gagal memuat emoji')
    } finally {
      setLoading(false)
    }
  }

  const handleAddEmoji = () => {
    if (!newEmoji.trim()) {
      showError('Masukkan emoji terlebih dahulu')
      return
    }

    // Extract all emojis from input
    const emojiRegex = /\p{Emoji}/gu
    const matches = newEmoji.match(emojiRegex)
    
    if (!matches || matches.length === 0) {
      showError('Input harus berupa emoji')
      return
    }

    // Smart detection: single or bulk
    if (matches.length === 1) {
      // Single emoji add
      const emoji = matches[0]
      if (emojis.includes(emoji)) {
        showError('Emoji sudah ada dalam list')
        return
      }
      setEmojis([...emojis, emoji])
      setNewEmoji('')
      setHasUnsavedChanges(true)
      showSuccess('Emoji ditambahkan! Klik "Save Changes" untuk menyimpan ke file.')
    } else {
      // Bulk import
      const newEmojis = matches.filter(e => !emojis.includes(e))
      
      if (newEmojis.length === 0) {
        showError('Semua emoji sudah ada dalam list')
        return
      }

      setEmojis([...emojis, ...newEmojis])
      setNewEmoji('')
      setHasUnsavedChanges(true)
      showSuccess(`${newEmojis.length} emoji ditambahkan! Klik "Save Changes" untuk menyimpan ke file.`)
    }
  }

  const handleRemoveEmoji = (emoji: string) => {
    confirm({
      title: 'Hapus Emoji',
      message: `Yakin ingin menghapus emoji "${emoji}" dari picker?`,
      confirmLabel: 'Hapus',
      cancelLabel: 'Batal',
      confirmVariant: 'danger',
      onConfirm: () => {
        setEmojis(emojis.filter(e => e !== emoji))
        setHasUnsavedChanges(true)
        showSuccess('Emoji dihapus! Klik "Save Changes" untuk menyimpan ke file.')
      }
    })
  }

  const handleSaveChanges = async () => {
    confirm({
      title: 'Save Changes',
      message: `Simpan perubahan emoji picker? Total ${emojis.length} emoji akan disimpan.`,
      confirmLabel: 'Simpan',
      cancelLabel: 'Batal',
      onConfirm: async () => {
        try {
          setSaving(true)
          const res = await fetch('/api/admin/emojis', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ emojis }),
          })

          const data = await res.json()

          if (res.ok) {
            showSuccess(`${data.count} emoji berhasil disimpan!`)
            setHasUnsavedChanges(false)
            fetchEmojis() // Reload from file
          } else {
            showError(data.error || 'Gagal menyimpan emoji')
          }
        } catch (error) {
          console.error('Error saving emojis:', error)
          showError('Gagal menyimpan emoji')
        } finally {
          setSaving(false)
        }
      }
    })
  }

  const handleReset = () => {
    confirm({
      title: 'Reset ke Default',
      message: 'Yakin ingin reset emoji picker ke default? Semua perubahan akan hilang.',
      confirmLabel: 'Reset',
      cancelLabel: 'Batal',
      confirmVariant: 'danger',
      onConfirm: () => {
        fetchEmojis()
        showSuccess('Emoji picker direset ke default')
      }
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/kategori"
            className="text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 inline-block mb-2"
          >
            ← Kembali ke Kategori
          </Link>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white mt-2">
            🎨 Emoji Picker Manager
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            Kelola emoji yang tersedia untuk pemilihan kategori
          </p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
          <>
            {/* Current Collection */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                  Current Collection
                </h2>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {emojis.length} emoji
                </span>
              </div>

              <div className="grid grid-cols-8 md:grid-cols-12 lg:grid-cols-16 gap-2 max-h-96 overflow-y-auto p-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                {emojis.map((emoji, index) => (
                  <div
                    key={index}
                    className="relative group"
                  >
                    <div className="text-3xl p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-center">
                      {emoji}
                    </div>
                    <button
                      onClick={() => handleRemoveEmoji(emoji)}
                      className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Add Emoji (Single or Bulk) */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                Add Emoji (Single or Multiple)
              </h2>
              <div className="space-y-3">
                <textarea
                  value={newEmoji}
                  onChange={(e) => setNewEmoji(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.ctrlKey) {
                      handleAddEmoji()
                    }
                  }}
                  placeholder="Paste emoji here... 🚀 or multiple: 🍕 🍔 🍟 🥤 🍿"
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 text-xl h-24 resize-none"
                />
                <button
                  onClick={handleAddEmoji}
                  className="w-full bg-brand-primary hover:bg-brand-primary-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  Add Emoji{newEmoji.trim() && ` (${[...newEmoji.matchAll(/\p{Emoji}/gu)].length} detected)`}
                </button>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                💡 Tip: Paste 1 emoji untuk single add, atau multiple emoji untuk bulk import.
                <br />
                Windows: Win + . | Mac: Cmd + Ctrl + Space | Web:{' '}
                <a href="https://emojipedia.org" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">
                  Emojipedia
                </a>
                <br />
                <span className="text-xs">Shortcut: Ctrl + Enter to add</span>
              </p>
            </div>

            {/* Actions */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
                    hasUnsavedChanges
                      ? 'bg-action-save hover:bg-action-save-hover text-white animate-pulse shadow-lg shadow-action-save/50'
                      : 'bg-action-save hover:bg-action-save-hover text-white'
                  } disabled:bg-action-cancel disabled:animate-none`}
                >
                  {saving ? 'Saving...' : hasUnsavedChanges ? '⚠️ Save Changes (Unsaved)' : '💾 Save Changes'}
                </button>
                <button
                  onClick={handleReset}
                  className="bg-action-edit hover:bg-action-edit-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                >
                  ↺ Reset
                </button>
              </div>
              <p className={`text-sm mt-3 ${hasUnsavedChanges ? 'text-status-warning font-semibold' : 'text-status-warning'}`}>
                {hasUnsavedChanges 
                  ? '⚠️ Ada perubahan yang belum disimpan! Klik "Save Changes" untuk menyimpan ke file.'
                  : '⚠️ Perubahan akan mempengaruhi emoji picker di halaman kategori'
                }
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
