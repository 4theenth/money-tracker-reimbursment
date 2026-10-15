'use client'

import { useState, useEffect } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import './DateRangePicker.css'

interface Props {
  startDate: Date
  endDate: Date
  onStartDateChange: (date: Date) => void
  onEndDateChange: (date: Date) => void
  onQuickFilter: (start: Date, end: Date) => void
}

export default function DateRangePicker({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  onQuickFilter 
}: Props) {
  const [localStart, setLocalStart] = useState(startDate)
  const [localEnd, setLocalEnd] = useState(endDate)
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
    
    if (date > localEnd) {
      // Auto-adjust end date to match start
      setLocalEnd(date)
      onEndDateChange(date)
    }
    
    setLocalStart(date)
    onStartDateChange(date)
    setActiveFilter('custom') // Manual change = custom
  }

  const handleEndChange = (date: Date | null) => {
    if (!date) return
    
    if (date < localStart) {
      // Auto-adjust start date to match end
      setLocalStart(date)
      onStartDateChange(date)
    }
    
    setLocalEnd(date)
    onEndDateChange(date)
    setActiveFilter('custom') // Manual change = custom
  }

  return (
    <div className="space-y-3">
      {/* Date Pickers */}
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Tanggal Mulai
          </label>
          <DatePicker
            selected={localStart}
            onChange={handleStartChange}
            dateFormat="dd/MM/yyyy"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            yearDropdownItemNumber={50}
            scrollableYearDropdown
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            calendarClassName="custom-datepicker"
            wrapperClassName="w-full"
          />
        </div>

        <div className="flex items-center justify-center pt-6">
          <span className="text-gray-400">→</span>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Tanggal Akhir
          </label>
          <DatePicker
            selected={localEnd}
            onChange={handleEndChange}
            dateFormat="dd/MM/yyyy"
            showMonthDropdown
            showYearDropdown
            dropdownMode="select"
            yearDropdownItemNumber={50}
            scrollableYearDropdown
            className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            calendarClassName="custom-datepicker"
            wrapperClassName="w-full"
          />
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex gap-2">
        <button
          onClick={applyThisMonth}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
            activeFilter === 'this_month'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          📅 Bulan Ini
        </button>
        <button
          onClick={applyLast3Months}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
            activeFilter === '3_months'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          📆 3 Bulan Terakhir
        </button>
        <button
          onClick={applyThisYear}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
            activeFilter === 'this_year'
              ? 'bg-blue-600 text-white shadow-lg'
              : 'bg-slate-700 hover:bg-slate-600 text-white'
          }`}
        >
          📊 Tahun Ini
        </button>
      </div>
    </div>
  )
}
