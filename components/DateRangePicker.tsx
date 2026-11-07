'use client'

import { useState, useEffect } from 'react'
import DatePickerInput from '@/components/ui/DatePickerInput'

interface Props {
  startDate: Date
  endDate: Date
  onStartDateChange: (date: Date) => void
  onEndDateChange: (date: Date) => void
  onQuickFilter: (start: Date, end: Date) => void
  /** Render the calendar in a body-level portal so a scrollable parent (e.g. a modal) can't clip it */
  calendarPortalId?: string
}

export default function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onQuickFilter,
  calendarPortalId
}: Props) {
  const [activeFilter, setActiveFilter] = useState<'this_month' | '3_months' | 'this_year' | 'custom'>('custom')

  // Detect which filter is active based on dates
  useEffect(() => {
    const now = new Date()
    
    // This Month check
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    if (startDate.toDateString() === thisMonthStart.toDateString() && 
        endDate.toDateString() === thisMonthEnd.toDateString()) {
      setActiveFilter('this_month')
      return
    }
    
    // Last 3 Months check
    const last3MonthsStart = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const last3MonthsEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    if (startDate.toDateString() === last3MonthsStart.toDateString() && 
        endDate.toDateString() === last3MonthsEnd.toDateString()) {
      setActiveFilter('3_months')
      return
    }
    
    // This Year check
    const thisYearStart = new Date(now.getFullYear(), 0, 1)
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    if (startDate.toDateString() === thisYearStart.toDateString() && 
        endDate.toDateString() === today.toDateString()) {
      setActiveFilter('this_year')
      return
    }
    
    // Otherwise custom
    setActiveFilter('custom')
  }, [startDate, endDate])

  // Quick filter functions
  const applyThisMonth = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setActiveFilter('this_month')
    onQuickFilter(start, end)
  }

  const applyLast3Months = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth() - 2, 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    setActiveFilter('3_months')
    onQuickFilter(start, end)
  }

  const applyThisYear = () => {
    const now = new Date()
    const start = new Date(now.getFullYear(), 0, 1)
    const end = new Date()
    setActiveFilter('this_year')
    onQuickFilter(start, end)
  }

  // Validate: start <= end
  const handleStartChange = (date: Date | null) => {
    if (!date) return
    
    if (date > endDate) {
      // Auto-adjust end date to match start
      onEndDateChange(date)
    }

    onStartDateChange(date)
    setActiveFilter('custom') // Manual change = custom
  }

  const handleEndChange = (date: Date | null) => {
    if (!date) return
    
    if (date < startDate) {
      // Auto-adjust start date to match end
      onStartDateChange(date)
    }

    onEndDateChange(date)
    setActiveFilter('custom') // Manual change = custom
  }

  return (
    <div className="space-y-3">
      {/* Date Pickers */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tanggal Mulai
          </label>
          <DatePickerInput
            selectedDate={startDate}
            onDateChange={handleStartChange}
            ariaLabel="Tanggal Mulai"
          />
        </div>

        <div className="hidden sm:flex items-center justify-center pt-6">
          <span aria-hidden="true" className="text-ink-muted">→</span>
        </div>

        <div className="flex-1 min-w-0">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tanggal Akhir
          </label>
          <DatePickerInput
            selectedDate={endDate}
            onDateChange={handleEndChange}
            ariaLabel="Tanggal Akhir"
          />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={applyThisMonth}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
            activeFilter === 'this_month'
              ? 'bg-brand-primary text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-ink dark:bg-gray-700 dark:hover:bg-gray-600'
          }`}
        >
          📅 Bulan Ini
        </button>
        <button
          onClick={applyLast3Months}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
            activeFilter === '3_months'
              ? 'bg-brand-primary text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-ink dark:bg-gray-700 dark:hover:bg-gray-600'
          }`}
        >
          📆 3 Bulan Terakhir
        </button>
        <button
          onClick={applyThisYear}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
            activeFilter === 'this_year'
              ? 'bg-brand-primary text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-ink dark:bg-gray-700 dark:hover:bg-gray-600'
          }`}
        >
          📊 Tahun Ini
        </button>
      </div>
    </div>
  )
}
