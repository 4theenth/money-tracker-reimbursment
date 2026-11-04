'use client'

import { useState, useEffect } from 'react'
import { formatCurrency } from '@/lib/utils'
import { useNotification } from '@/contexts/NotificationContext'
import { emojiOptions } from '@/lib/config/emojis'
import Modal from '@/components/Modal'
import Link from 'next/link'

interface BudgetItemDetail {
  id?: number
  categoryId: number
  categoryName: string
  categoryIcon: string | null
  categoryColor: string | null
  targetAmount: number
  actualAmount: number
  difference: number
  percentage: number
  status: 'OK' | 'ALERT' | 'OVER'
}

interface BudgetCategoryOption {
  id: number
  name: string
  icon: string | null
  color: string | null
}

interface BudgetSummary {
  period: {
    id?: number
    month: number
    year: number
    monthName: string
    label: string
    isConfigured: boolean
  }
  targetIncome: number
  actualIncome: number
  incomeDifference: number
  totalTargetExpense: number
  totalActualExpense: number
  totalExpenseDifference: number
  totalExpensePercentage: number
  unallocatedBudget: number
  statusCounts: {
    ok: number
    alert: number
    over: number
    total: number
  }
  items: BudgetItemDetail[]
  allExpenseCategories?: BudgetCategoryOption[]
}

export default function BudgetPlanningPage() {
  const { showSuccess, showError, confirm } = useNotification()
  const [data, setData] = useState<BudgetSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState('')

  // Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [copying, setCopying] = useState(false)
  const [modalTargetIncome, setModalTargetIncome] = useState('')
  const [modalItems, setModalItems] = useState<
    Array<{
      categoryId: number
      categoryName: string
      categoryIcon: string | null
      targetAmount: string
    }>
  >([])

  // Quick Add Category inside Modal State
  const [isAddingCategory, setIsAddingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [newCategoryIcon, setNewCategoryIcon] = useState('📦')
  const [availableEmojis, setAvailableEmojis] = useState<string[]>(emojiOptions)
  const [addingCategory, setAddingCategory] = useState(false)

  // Remove Category Modal State (Option B: Dual-Action)
  const [categoryToRemove, setCategoryToRemove] = useState<{
    categoryId: number
    categoryName: string
    categoryIcon: string | null
  } | null>(null)
  const [deletingGlobally, setDeletingGlobally] = useState(false)

  // Quick Edit Target Shortcut Modal State
  const [quickEditItem, setQuickEditItem] = useState<BudgetItemDetail | null>(null)
  const [quickEditTargetAmount, setQuickEditTargetAmount] = useState('')
  const [savingQuickEdit, setSavingQuickEdit] = useState(false)

  useEffect(() => {
    const now = new Date()
    setSelectedMonth((now.getMonth() + 1).toString())
    setSelectedYear(now.getFullYear().toString())
  }, [])

  useEffect(() => {
    if (selectedMonth && selectedYear) {
      fetchBudgetData()
    }
  }, [selectedMonth, selectedYear])

  const fetchBudgetData = async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/budget?month=${selectedMonth}&year=${selectedYear}`)
      if (!res.ok) {
        throw new Error('Gagal memuat data anggaran')
      }
      const budgetData = await res.json()
      setData(budgetData)
    } catch (error: any) {
      console.error('Error fetching budget data:', error)
      showError(error.message || 'Gagal memuat data anggaran')
    } finally {
      setLoading(false)
    }
  }

  const handleOpenEditModal = () => {
    if (!data) return
    setIsAddingCategory(false)
    setNewCategoryName('')
    setNewCategoryIcon('📦')
    fetchLatestEmojis()
    setModalTargetIncome(data.targetIncome ? data.targetIncome.toString() : '')
    setModalItems(
      data.items.map((item) => ({
        categoryId: item.categoryId,
        categoryName: item.categoryName,
        categoryIcon: item.categoryIcon,
        targetAmount: item.targetAmount ? item.targetAmount.toString() : '',
      }))
    )
    setIsEditModalOpen(true)
  }

  const fetchLatestEmojis = async () => {
    try {
      const res = await fetch('/api/admin/emojis')
      if (res.ok) {
        const json = await res.json()
        if (json.emojis && Array.isArray(json.emojis) && json.emojis.length > 0) {
          setAvailableEmojis(json.emojis)
        }
      }
    } catch (e) {
      // Fallback silently to static emojiOptions
    }
  }

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      showError('Nama kategori baru wajib diisi')
      return
    }

    setAddingCategory(true)
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          type: 'expense',
          icon: newCategoryIcon || '📦',
          color: '#3b82f6',
        }),
      })

      const newCat = await res.json()
      if (!res.ok) {
        throw new Error(newCat.error || 'Gagal menambahkan kategori baru')
      }

      // Add to modalItems at the beginning with 0 target
      setModalItems((prev) => [
        {
          categoryId: newCat.id,
          categoryName: newCat.name,
          categoryIcon: newCat.icon,
          targetAmount: '',
        },
        ...prev,
      ])

      showSuccess(`Kategori "${newCat.name}" berhasil dibuat dan ditambahkan ke daftar!`)
      setNewCategoryName('')
      setNewCategoryIcon('📦')
      setIsAddingCategory(false)
    } catch (error: any) {
      console.error('Error creating category:', error)
      showError(error.message || 'Gagal membuat kategori baru')
    } finally {
      setAddingCategory(false)
    }
  }

  const handleItemTargetChange = (categoryId: number, value: string) => {
    setModalItems((prev) =>
      prev.map((item) =>
        item.categoryId === categoryId ? { ...item, targetAmount: value } : item
      )
    )
  }

  const handleRequestRemoveCategory = (item: {
    categoryId: number
    categoryName: string
    categoryIcon: string | null
  }) => {
    setCategoryToRemove(item)
  }

  const handleExcludeFromMonth = async () => {
    if (!categoryToRemove) return
    const catName = categoryToRemove.categoryName

    // If big modal is open, simply remove from modalItems (saved when big modal is submitted)
    if (isEditModalOpen) {
      setModalItems((prev) =>
        prev.filter((it) => it.categoryId !== categoryToRemove.categoryId)
      )
      showSuccess(`"${catName}" dikeluarkan dari daftar anggaran bulan ini.`)
      setCategoryToRemove(null)
      return
    }

    // If triggered from the table shortcut, immediately save remaining items to backend
    if (data) {
      try {
        const remainingItems = data.items
          .filter((it) => it.categoryId !== categoryToRemove.categoryId)
          .map((it) => ({
            categoryId: it.categoryId,
            targetAmount: it.targetAmount,
          }))

        const res = await fetch('/api/budget', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            month: parseInt(selectedMonth),
            year: parseInt(selectedYear),
            targetIncome: data.targetIncome,
            items: remainingItems,
          }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({}))
          throw new Error(err.error || 'Gagal mengeluarkan kategori dari anggaran')
        }

        const resJson = await res.json()
        setData(resJson.data)
        showSuccess(`"${catName}" berhasil dikeluarkan dari anggaran bulan ${data.period.label}.`)
      } catch (error: any) {
        console.error('Error excluding category from table:', error)
        showError(error.message || 'Gagal mengeluarkan kategori')
      }
    }
    setCategoryToRemove(null)
  }

  const handleDeactivateGlobally = async () => {
    if (!categoryToRemove) return
    setDeletingGlobally(true)
    try {
      const res = await fetch(`/api/categories/${categoryToRemove.categoryId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal menonaktifkan kategori')
      }
      const catName = categoryToRemove.categoryName

      // If big modal is open, remove from modalItems
      if (isEditModalOpen) {
        setModalItems((prev) =>
          prev.filter((it) => it.categoryId !== categoryToRemove.categoryId)
        )
      }

      // Also remove from local list in table immediately
      if (data) {
        // Also remove from budget in backend if it was in the budget
        const remainingItems = data.items
          .filter((it) => it.categoryId !== categoryToRemove.categoryId)
          .map((it) => ({
            categoryId: it.categoryId,
            targetAmount: it.targetAmount,
          }))

        await fetch('/api/budget', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            month: parseInt(selectedMonth),
            year: parseInt(selectedYear),
            targetIncome: data.targetIncome,
            items: remainingItems,
          }),
        })

        await fetchBudgetData()
      }

      showSuccess(`Kategori "${catName}" berhasil dinonaktifkan dari seluruh sistem!`)
      setCategoryToRemove(null)
    } catch (error: any) {
      console.error('Error deactivating category:', error)
      showError(error.message || 'Gagal menonaktifkan kategori dari sistem')
    } finally {
      setDeletingGlobally(false)
    }
  }

  const handleQuickEditTarget = (item: BudgetItemDetail) => {
    setQuickEditItem(item)
    setQuickEditTargetAmount(item.targetAmount > 0 ? item.targetAmount.toString() : '')
  }

  const handleSaveQuickEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!data || !quickEditItem) return
    setSavingQuickEdit(true)
    try {
      const newTarget = parseFloat(quickEditTargetAmount) || 0

      // If this item is already in data.items, update its target; otherwise add it
      let found = false
      const updatedItems = data.items.map((it) => {
        if (it.categoryId === quickEditItem.categoryId) {
          found = true
          return { categoryId: it.categoryId, targetAmount: newTarget }
        }
        return { categoryId: it.categoryId, targetAmount: it.targetAmount }
      })

      if (!found) {
        updatedItems.push({
          categoryId: quickEditItem.categoryId,
          targetAmount: newTarget,
        })
      }

      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month: parseInt(selectedMonth),
          year: parseInt(selectedYear),
          targetIncome: data.targetIncome,
          items: updatedItems,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal memperbarui target anggaran')
      }

      const resJson = await res.json()
      setData(resJson.data)
      showSuccess(`Target ${quickEditItem.categoryName} berhasil diperbarui!`)
      setQuickEditItem(null)
    } catch (error: any) {
      console.error('Error saving quick edit target:', error)
      showError(error.message || 'Gagal memperbarui target')
    } finally {
      setSavingQuickEdit(false)
    }
  }

  const handleAddExistingCategory = (cat: {
    id: number
    name: string
    icon: string | null
  }) => {
    setModalItems((prev) => [
      {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryIcon: cat.icon,
        targetAmount: '',
      },
      ...prev,
    ])
    showSuccess(`Pos "${cat.name}" ditambahkan ke anggaran bulan ini.`)
  }

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        month: parseInt(selectedMonth),
        year: parseInt(selectedYear),
        targetIncome: parseFloat(modalTargetIncome) || 0,
        items: modalItems.map((item) => ({
          categoryId: item.categoryId,
          targetAmount: parseFloat(item.targetAmount) || 0,
        })),
      }

      const res = await fetch('/api/budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Gagal menyimpan target anggaran')
      }

      const responseData = await res.json()
      setData(responseData.data)
      setIsEditModalOpen(false)
      showSuccess(`Anggaran untuk periode ${data?.period.label} berhasil disimpan!`)
    } catch (error: any) {
      console.error('Error saving budget:', error)
      showError(error.message || 'Gagal menyimpan anggaran')
    } finally {
      setSaving(false)
    }
  }

  const handleCopyPreviousMonth = () => {
    const curMonth = parseInt(selectedMonth)
    const curYear = parseInt(selectedYear)
    const prevMonth = curMonth === 1 ? 12 : curMonth - 1
    const prevYear = curMonth === 1 ? curYear - 1 : curYear

    confirm({
      title: 'Salin Anggaran Bulan Lalu',
      message: `Apakah Anda ingin menyalin target anggaran dari bulan ${prevMonth}/${prevYear} ke bulan ${curMonth}/${curYear}? Data target yang ada saat ini akan diperbarui.`,
      confirmLabel: 'Salin Sekarang',
      cancelLabel: 'Batal',
      confirmVariant: 'primary',
      onConfirm: async () => {
        setCopying(true)
        try {
          const res = await fetch('/api/budget/copy-previous', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              targetMonth: curMonth,
              targetYear: curYear,
              sourceMonth: prevMonth,
              sourceYear: prevYear,
            }),
          })

          if (!res.ok) {
            const err = await res.json().catch(() => ({}))
            throw new Error(err.error || 'Gagal menyalin anggaran bulan sebelumnya')
          }

          const responseData = await res.json()
          setData(responseData.data)
          showSuccess(`Target anggaran berhasil disalin dari ${prevMonth}/${prevYear}!`)
        } catch (error: any) {
          console.error('Error copying previous budget:', error)
          showError(error.message || 'Gagal menyalin anggaran')
        } finally {
          setCopying(false)
        }
      },
    })
  }

  const months = [
    { value: '1', label: 'Januari' },
    { value: '2', label: 'Februari' },
    { value: '3', label: 'Maret' },
    { value: '4', label: 'April' },
    { value: '5', label: 'Mei' },
    { value: '6', label: 'Juni' },
    { value: '7', label: 'Juli' },
    { value: '8', label: 'Agustus' },
    { value: '9', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' },
  ]

  const years = ['2024', '2025', '2026', '2027', '2028']

  // Modal live calculations
  const modalTotalExpenses = modalItems.reduce(
    (sum, item) => sum + (parseFloat(item.targetAmount) || 0),
    0
  )
  const modalIncome = parseFloat(modalTargetIncome) || 0
  const modalUnallocated = modalIncome - modalTotalExpenses

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-brand-primary hover:text-brand-primary-hover font-medium mb-4 transition-colors"
          >
            ← Kembali ke Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                <span>🎯</span>
                <span>Perencanaan Keuangan (Budget Planning)</span>
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Tetapkan target anggaran dan pantau realisasi belanja bulanan secara real-time
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCopyPreviousMonth}
                disabled={copying || loading}
                className="px-4 py-2.5 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg font-medium text-sm transition-all shadow-sm flex items-center gap-2 disabled:opacity-50"
                title="Salin target dari bulan sebelumnya"
              >
                <span>📋</span>
                <span>{copying ? 'Menyalin...' : 'Salin Bulan Lalu'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenEditModal}
                disabled={loading}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-all shadow-lg flex items-center gap-2 disabled:opacity-50"
              >
                <span>🎯</span>
                <span>Atur Target Anggaran</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Periode:
                </label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {months.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm font-medium focus:ring-2 focus:ring-blue-500"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Configured Status Tag */}
            {data && (
              <div className="flex items-center gap-2">
                {data.period.isConfigured ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                    Target Anggaran Aktif
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                    Belum Dikonfigurasi
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-16 text-center text-gray-500">
            <div className="text-5xl mb-3 animate-bounce">🎯</div>
            <p className="text-lg font-medium">Memuat data anggaran...</p>
          </div>
        ) : !data ? null : (
          <>
            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Card 1: Target Pendapatan */}
              <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-xs font-medium uppercase tracking-wider mb-1">
                      Target Pendapatan
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(data.targetIncome)}
                    </p>
                    <p className="text-emerald-100 text-xs mt-2">
                      Realisasi: <span className="font-semibold">{formatCurrency(data.actualIncome)}</span>
                    </p>
                  </div>
                  <div className="text-4xl opacity-80">💰</div>
                </div>
              </div>

              {/* Card 2: Total Target Belanja */}
              <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg shadow-lg p-5 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-xs font-medium uppercase tracking-wider mb-1">
                      Total Target Belanja
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(data.totalTargetExpense)}
                    </p>
                    <p className="text-indigo-100 text-xs mt-2">
                      Realisasi: <span className="font-semibold">{formatCurrency(data.totalActualExpense)}</span>
                    </p>
                  </div>
                  <div className="text-4xl opacity-80">📊</div>
                </div>
              </div>

              {/* Card 3: Sisa Kuota Belanja */}
              <div
                className={`bg-gradient-to-br ${
                  data.totalExpenseDifference >= 0
                    ? 'from-blue-500 to-blue-600'
                    : 'from-rose-500 to-rose-600'
                } rounded-lg shadow-lg p-5 text-white`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs font-medium uppercase tracking-wider mb-1">
                      {data.totalExpenseDifference >= 0 ? 'Sisa Kuota Belanja' : 'Defisit Anggaran'}
                    </p>
                    <p className="text-2xl font-bold">
                      {formatCurrency(Math.abs(data.totalExpenseDifference))}
                    </p>
                    <p className="text-blue-100 text-xs mt-2">
                      {data.totalExpenseDifference >= 0
                        ? `Terpakai ${data.totalExpensePercentage}% dari target`
                        : `Overbudget sebesar ${data.totalExpensePercentage}%!`}
                    </p>
                  </div>
                  <div className="text-4xl opacity-80">
                    {data.totalExpenseDifference >= 0 ? '🛡️' : '⚠️'}
                  </div>
                </div>
              </div>

              {/* Card 4: Sisa Budget Bebas (Unallocated) */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-5 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">
                      Sisa Budget Bebas
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        data.unallocatedBudget >= 0
                          ? 'text-gray-800 dark:text-white'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {formatCurrency(data.unallocatedBudget)}
                    </p>
                    <div className="flex items-center gap-1.5 mt-2 text-xs font-medium">
                      <span className="text-green-600 dark:text-green-400">
                        🟢 {data.statusCounts.ok} OK
                      </span>
                      <span>•</span>
                      <span className="text-amber-600 dark:text-amber-400">
                        🟡 {data.statusCounts.alert} Alert
                      </span>
                      <span>•</span>
                      <span className="text-rose-600 dark:text-rose-400">
                        🔴 {data.statusCounts.over} Over
                      </span>
                    </div>
                  </div>
                  <div className="text-4xl opacity-70">⚖️</div>
                </div>
              </div>
            </div>

            {/* Overall Progress Bar */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h2 className="text-base font-bold text-gray-800 dark:text-white">
                    Penyerapan Total Anggaran ({data.period.label})
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {formatCurrency(data.totalActualExpense)} terpakai dari target{' '}
                    {formatCurrency(data.totalTargetExpense)}
                  </p>
                </div>
                <div className="text-right">
                  <span
                    className={`text-2xl font-bold font-mono ${
                      data.totalExpensePercentage > 100
                        ? 'text-rose-600 dark:text-rose-400'
                        : data.totalExpensePercentage >= 80
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {data.totalExpensePercentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar Container */}
              <div className="w-full bg-gray-200 dark:bg-gray-700 h-3.5 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    data.totalExpensePercentage > 100
                      ? 'bg-rose-500 animate-pulse'
                      : data.totalExpensePercentage >= 80
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{
                    width: `${Math.min(data.totalExpensePercentage, 100)}%`,
                  }}
                />
              </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700 mb-8">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                    Komparasi Target vs Realisasi Belanja
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Sistem pemantau batas pengeluaran per kategori
                  </p>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                    ≤ 80% (Aman)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                    80-100% (Waspada)
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                    &gt; 100% (Overbudget)
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 text-left">Kategori Belanja</th>
                      <th className="px-4 py-3 text-right">Target Budget</th>
                      <th className="px-4 py-3 text-right">Realisasi (Actual)</th>
                      <th className="px-4 py-3 text-right">Sisa Kuota (Selisih)</th>
                      <th className="px-4 py-3 text-left min-w-[160px]">Penyerapan (% Used)</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    {data.items.map((item, index) => (
                      <tr
                        key={item.categoryId}
                        className={`${
                          index % 2 === 0
                            ? 'bg-white dark:bg-gray-800'
                            : 'bg-gray-50/60 dark:bg-gray-800/50'
                        } hover:bg-blue-50/40 dark:hover:bg-gray-700 transition-colors`}
                      >
                        {/* Kategori */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <span className="text-xl">{item.categoryIcon || '📦'}</span>
                            <div>
                              <span className="font-semibold text-gray-800 dark:text-gray-200">
                                {item.categoryName}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Target */}
                        <td className="px-4 py-3.5 text-right font-medium text-gray-700 dark:text-gray-300">
                          {item.targetAmount > 0 ? (
                            formatCurrency(item.targetAmount)
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 italic text-xs">
                              Tidak diatur
                            </span>
                          )}
                        </td>

                        {/* Actual */}
                        <td className="px-4 py-3.5 text-right font-semibold font-mono text-gray-900 dark:text-gray-100">
                          {item.actualAmount > 0 ? (
                            formatCurrency(item.actualAmount)
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 font-normal">-</span>
                          )}
                        </td>

                        {/* Sisa Kuota */}
                        <td className="px-4 py-3.5 text-right font-mono text-sm">
                          {item.difference < 0 ? (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">
                              -{formatCurrency(Math.abs(item.difference))}
                            </span>
                          ) : item.targetAmount > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                              +{formatCurrency(item.difference)}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </td>

                        {/* Progress Bar */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-mono font-semibold text-gray-700 dark:text-gray-300">
                                {item.percentage}%
                              </span>
                              <span className="text-[11px] text-gray-500">
                                {item.targetAmount > 0 ? 'dari target' : 'tanpa target'}
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  item.status === 'OVER'
                                    ? 'bg-rose-500'
                                    : item.status === 'ALERT'
                                    ? 'bg-amber-500'
                                    : 'bg-emerald-500'
                                }`}
                                style={{
                                  width: `${Math.min(item.percentage, 100)}%`,
                                }}
                              />
                            </div>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          {item.status === 'OVER' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                              <span>🔴</span>
                              <span>OVER</span>
                            </span>
                          ) : item.status === 'ALERT' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              <span>🟡</span>
                              <span>ALERT</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <span>🟢</span>
                              <span>OK</span>
                            </span>
                          )}
                        </td>

                        {/* Aksi Shortcuts */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleQuickEditTarget(item)}
                              className="p-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-lg transition-colors cursor-pointer"
                              title={`Ubah target anggaran ${item.categoryName}`}
                            >
                              <span className="text-sm">✏️</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => handleRequestRemoveCategory(item)}
                              className="p-1.5 text-rose-500 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors cursor-pointer"
                              title={`Kurangi / Hapus ${item.categoryName}`}
                            >
                              <span className="text-sm">🗑️</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>

                  {/* Table Footer Summary */}
                  <tfoot className="bg-gray-100 dark:bg-gray-900 font-bold border-t-2 border-gray-300 dark:border-gray-700 text-sm">
                    <tr>
                      <td className="px-4 py-3.5 text-gray-800 dark:text-white">
                        TOTAL BELANJA:
                      </td>
                      <td className="px-4 py-3.5 text-right text-gray-800 dark:text-white">
                        {formatCurrency(data.totalTargetExpense)}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-gray-900 dark:text-gray-100">
                        {formatCurrency(data.totalActualExpense)}
                      </td>
                      <td
                        className={`px-4 py-3.5 text-right font-mono ${
                          data.totalExpenseDifference >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {data.totalExpenseDifference >= 0 ? '+' : '-'}
                        {formatCurrency(Math.abs(data.totalExpenseDifference))}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-mono text-gray-800 dark:text-gray-200">{data.totalExpensePercentage}% Terpakai</span>
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <span className="text-xs text-gray-600 dark:text-gray-300 font-semibold">
                          {data.statusCounts.over > 0 ? '⚠️ Overbudget' : '✅ Terkendali'}
                        </span>
                      </td>
                      <td className="px-4 py-3.5"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal Dialog Atur Anggaran */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`🎯 Atur Target Anggaran (${data?.period.label || ''})`}
        maxWidth="xl"
      >
        <form onSubmit={handleSaveBudget} className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2 mb-3">
            Tentukan target pendapatan dan batas pengeluaran untuk periode ini
          </p>

          {/* Target Income Input */}
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <label className="block text-sm font-bold text-emerald-800 dark:text-emerald-300 mb-1">
              Target Pendapatan Bulanan (Rp) <span className="text-status-danger font-bold">*</span>
            </label>
            <input
              type="number"
              value={modalTargetIncome}
              onChange={(e) => setModalTargetIncome(e.target.value)}
              placeholder="Contoh: 5000000"
              min="0"
              step="1000"
              required
              className="w-full px-3 py-2 text-base font-semibold border border-emerald-300 dark:border-emerald-700 rounded-lg dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
              Total estimasi gaji, bonus, dan pemasukan bulan ini
            </p>
          </div>

          {/* Category Target Inputs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-800 dark:text-white">
                Target Alokasi Belanja per Kategori:
              </label>
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800"
              >
                <span>{isAddingCategory ? '✕ Tutup Form' : '+ Tambah Kategori Baru'}</span>
              </button>
            </div>

            {/* Inline Add Category Form */}
            {isAddingCategory && (
              <div className="mb-3 p-3.5 bg-blue-50/70 dark:bg-gray-800/90 rounded-lg border-2 border-blue-200 dark:border-blue-700/60 animate-fadeIn">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <span>🏷️</span>
                    <span>Buat Pos Belanja Baru</span>
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Otomatis tipe Pengeluaran
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nama Kategori <span className="text-status-danger font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      placeholder="Contoh: Skincare, Cicilan, Kado"
                      className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Pilih Icon Emoji (Terpilih: {newCategoryIcon})
                    </label>
                    <div className="grid grid-cols-8 gap-1.5 max-h-28 overflow-y-auto p-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                      {availableEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => setNewCategoryIcon(emoji)}
                          className={`text-xl p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                            newCategoryIcon === emoji
                              ? 'bg-blue-100 dark:bg-blue-900/60 ring-2 ring-blue-500'
                              : ''
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingCategory(false)}
                      className="px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      disabled={addingCategory}
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={addingCategory || !newCategoryName.trim()}
                      className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors flex items-center gap-1 shadow-sm"
                    >
                      <span>{addingCategory ? 'Menyimpan...' : '✓ Simpan & Masukkan ke Anggaran'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Unbudgeted categories chips (Add back excluded categories) */}
            {(() => {
              const unbudgeted = (data?.allExpenseCategories || []).filter(
                (c) => !modalItems.some((it) => it.categoryId === c.id)
              )
              if (unbudgeted.length === 0) return null
              return (
                <div className="mb-2.5 p-2.5 bg-gray-50 dark:bg-gray-800/80 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      Kategori yang belum masuk anggaran bulan ini:
                    </span>
                    <span className="text-[11px] text-gray-400">Klik untuk menambahkan</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {unbudgeted.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleAddExistingCategory(c)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 text-gray-800 dark:text-gray-200 transition-colors shadow-sm cursor-pointer"
                        title={`Tambahkan ${c.name} ke anggaran`}
                      >
                        <span>{c.icon || '📦'}</span>
                        <span>{c.name}</span>
                        <span className="text-blue-500 font-bold ml-0.5">+</span>
                      </button>
                    ))}
                  </div>
                </div>
              )
            })()}

            <div className="max-h-[40vh] overflow-y-auto space-y-2.5 p-1">
              {modalItems.map((item) => (
                <div
                  key={item.categoryId}
                  className="flex items-center justify-between gap-3 p-2.5 bg-gray-50 dark:bg-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600 shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-[140px]">
                    <span className="text-2xl">{item.categoryIcon || '📦'}</span>
                    <span className="text-sm font-semibold text-gray-800 dark:text-white">
                      {item.categoryName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 flex-1 max-w-[240px] justify-end">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-2 text-xs text-gray-400 font-semibold">
                        Rp
                      </span>
                      <input
                        type="number"
                        value={item.targetAmount}
                        onChange={(e) =>
                          handleItemTargetChange(item.categoryId, e.target.value)
                        }
                        placeholder="0"
                        min="0"
                        step="1000"
                        className="w-full pl-9 pr-3 py-1.5 text-sm font-mono font-medium border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 text-right"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRequestRemoveCategory(item)}
                      className="p-1.5 text-gray-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                      title={`Kurangi / Hapus ${item.categoryName}`}
                    >
                      <span className="text-base">🗑️</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Live Summary */}
          <div className="bg-gray-100 dark:bg-gray-900/80 p-3.5 rounded-lg text-xs space-y-1.5 border border-gray-300 dark:border-gray-700">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-300 font-medium">Total Alokasi Belanja:</span>
              <span className="font-bold font-mono text-gray-900 dark:text-white">
                {formatCurrency(modalTotalExpenses)}
              </span>
            </div>
            <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-1.5">
              <span className="text-gray-600 dark:text-gray-300 font-medium">Sisa Budget Bebas:</span>
              <span
                className={`font-bold font-mono ${
                  modalUnallocated >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {formatCurrency(modalUnallocated)}
              </span>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm"
              disabled={saving}
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm shadow"
            >
              {saving ? 'Menyimpan...' : 'Simpan Anggaran'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Dialog Kurangi Kategori (Option B: Dual-Action) */}
      <Modal
        isOpen={!!categoryToRemove}
        onClose={() => setCategoryToRemove(null)}
        title={`Kurangi Pos "${categoryToRemove?.categoryName || ''}"`}
        maxWidth="md"
      >
        <div className="space-y-4">
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
            Pilih bagaimana Anda ingin mengurangi pos belanja ini:
          </p>

          <div className="p-3 bg-gray-50 dark:bg-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center gap-3">
            <span className="text-3xl">{categoryToRemove?.categoryIcon || '📦'}</span>
            <div>
              <h4 className="font-bold text-gray-800 dark:text-white text-base">
                {categoryToRemove?.categoryName}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pos Belanja Pengeluaran
              </p>
            </div>
          </div>

          <div className="space-y-3 pt-1">
            {/* Pilihan 1: Keluarkan dari Bulan Ini */}
            <div className="p-3.5 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-700 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <span>🗓️</span>
                    <span>Keluarkan dari Anggaran Bulan Ini Saja</span>
                  </h5>
                  <p className="text-xs text-blue-700 dark:text-blue-400/90 leading-relaxed">
                    Pos ini tidak akan ditargetkan pada bulan {data?.period.label}. Kategori master tetap aman di sistem dan tetap bisa dipakai transaksi harian.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExcludeFromMonth}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-sm transition-colors cursor-pointer"
                >
                  Keluarkan
                </button>
              </div>
            </div>

            {/* Pilihan 2: Hapus dari Seluruh Sistem */}
            <div className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 hover:border-rose-400 dark:hover:border-rose-700 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <h5 className="text-sm font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5">
                    <span>⚠️</span>
                    <span>Hapus / Nonaktifkan dari Seluruh Sistem</span>
                  </h5>
                  <p className="text-xs text-rose-700 dark:text-rose-400/90 leading-relaxed">
                    Menonaktifkan kategori ini secara global dari aplikasi. Kategori tidak akan muncul lagi di formulir transaksi maupun anggaran mana pun.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDeactivateGlobally}
                  disabled={deletingGlobally}
                  className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-sm transition-colors cursor-pointer"
                >
                  {deletingGlobally ? 'Menghapus...' : 'Hapus Global'}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setCategoryToRemove(null)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-xs font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal Dialog Ubah Target Cepat (Shortcut ✏️ dari Tabel) */}
      <Modal
        isOpen={!!quickEditItem}
        onClose={() => setQuickEditItem(null)}
        title={`✏️ Ubah Target: ${quickEditItem?.categoryName || ''}`}
        maxWidth="md"
      >
        {quickEditItem && (
          <form onSubmit={handleSaveQuickEdit} className="space-y-4">
            <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
              Sesuaikan target anggaran untuk periode {data?.period.label}
            </p>

            <div className="p-3 bg-gray-50 dark:bg-gray-700/60 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{quickEditItem.categoryIcon || '📦'}</span>
                <div>
                  <h4 className="font-bold text-gray-800 dark:text-white text-base">
                    {quickEditItem.categoryName}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Realisasi Belanja Saat Ini:{' '}
                    <span className="font-semibold font-mono text-gray-700 dark:text-gray-300">
                      {formatCurrency(quickEditItem.actualAmount)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Target Budget Baru (Rp) <span className="text-status-danger font-bold">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-sm text-gray-400 font-semibold">
                  Rp
                </span>
                <input
                  type="number"
                  value={quickEditTargetAmount}
                  onChange={(e) => setQuickEditTargetAmount(e.target.value)}
                  placeholder="0"
                  min="0"
                  step="1000"
                  autoFocus
                  required
                  className="w-full pl-10 pr-3 py-2 text-base font-mono font-semibold border border-gray-300 dark:border-gray-500 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Isi 0 jika tidak ingin menetapkan batas pengeluaran untuk pos ini
              </p>
            </div>

            {/* Quick Live Preview */}
            {(() => {
              const newTarget = parseFloat(quickEditTargetAmount) || 0
              const diff = newTarget - quickEditItem.actualAmount
              const pct =
                newTarget > 0
                  ? Math.round((quickEditItem.actualAmount / newTarget) * 1000) / 10
                  : 0
              return (
                <div className="p-3 bg-gray-100 dark:bg-gray-900/80 rounded-lg text-xs space-y-1.5 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Estimasi Sisa Kuota Belanja:
                    </span>
                    <span
                      className={`font-bold font-mono ${
                        diff >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {diff >= 0 ? '+' : ''}
                      {formatCurrency(diff)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Estimasi Penyerapan:
                    </span>
                    <span className="font-bold font-mono text-gray-800 dark:text-gray-200">
                      {pct}%
                    </span>
                  </div>
                </div>
              )
            })()}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuickEditItem(null)}
                className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-sm cursor-pointer"
                disabled={savingQuickEdit}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={savingQuickEdit}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 text-sm shadow cursor-pointer"
              >
                {savingQuickEdit ? 'Menyimpan...' : '✓ Simpan Target'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
