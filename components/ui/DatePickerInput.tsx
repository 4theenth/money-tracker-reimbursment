'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatLocalDate } from '@/lib/utils'

const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const MONTH_SHORT_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
]

const DAY_NAMES = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']

function parseLocalDateString(value: string): Date {
  if (!value) return new Date()
  const parts = value.split('-').map(Number)
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2])
  }
  const d = new Date(value)
  return isNaN(d.getTime()) ? new Date() : d
}

interface DatePickerInputProps {
  /** Date string in 'YYYY-MM-DD' format */
  value?: string
  /** Callback returning 'YYYY-MM-DD' string */
  onChange?: (value: string) => void
  /** Optional Date object (alternative to string value) */
  selectedDate?: Date
  /** Optional callback returning Date object */
  onDateChange?: (date: Date) => void
  required?: boolean
  disabled?: boolean
  placeholder?: string
  className?: string
  ariaLabel?: string
}

interface PopupPosition {
  top?: number
  bottom?: number
  left: number
}

type ViewMode = 'days' | 'months' | 'years'

export default function DatePickerInput({
  value,
  onChange,
  selectedDate,
  onDateChange,
  required = false,
  disabled = false,
  placeholder = 'Pilih tanggal...',
  className = '',
  ariaLabel,
}: DatePickerInputProps) {
  const activeDate = useMemo(() => {
    if (selectedDate) return selectedDate
    if (value) return parseLocalDateString(value)
    return new Date()
  }, [selectedDate, value])

  const [isOpen, setIsOpen] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('days')
  const [viewYear, setViewYear] = useState(activeDate.getFullYear())
  const [viewMonth, setViewMonth] = useState(activeDate.getMonth())
  const [yearPageStart, setYearPageStart] = useState(
    Math.floor(activeDate.getFullYear() / 12) * 12
  )
  const [position, setPosition] = useState<PopupPosition | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popupRef = useRef<HTMLDivElement>(null)

  // Sync calendar view to selected date when opened
  useEffect(() => {
    if (isOpen) {
      const y = activeDate.getFullYear()
      const m = activeDate.getMonth()
      setViewYear(y)
      setViewMonth(m)
      setYearPageStart(Math.floor(y / 12) * 12)
      setViewMode('days')
    }
  }, [isOpen, activeDate])

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const popupWidth = 296
    const popupHeight = 340
    const gap = 6

    const spaceBelow = viewportHeight - rect.bottom - gap
    const spaceAbove = rect.top - gap
    const openUpward = spaceBelow < popupHeight && spaceAbove > spaceBelow

    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, viewportWidth - popupWidth - 8)
    )

    if (openUpward) {
      setPosition({
        bottom: viewportHeight - rect.top + gap,
        left,
      })
    } else {
      setPosition({
        top: rect.bottom + gap,
        left,
      })
    }
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        popupRef.current &&
        !popupRef.current.contains(target)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Update position on scroll / resize
  useEffect(() => {
    if (!isOpen) return
    updatePosition()

    const handleScrollOrResize = () => updatePosition()
    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [isOpen, updatePosition])

  const handleSelectDate = (date: Date) => {
    if (onChange) {
      onChange(formatLocalDate(date))
    }
    if (onDateChange) {
      onDateChange(date)
    }
    setIsOpen(false)
    triggerRef.current?.focus()
  }

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11)
      setViewYear((y) => y - 1)
    } else {
      setViewMonth((m) => m - 1)
    }
  }

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0)
      setViewYear((y) => y + 1)
    } else {
      setViewMonth((m) => m + 1)
    }
  }

  // Generate 42 calendar cells (6 weeks) for current viewMonth & viewYear
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate()

    const cells: Array<{ date: Date; isCurrentMonth: boolean }> = []

    // Previous month trailing days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      cells.push({
        date: new Date(viewYear, viewMonth - 1, daysInPrevMonth - i),
        isCurrentMonth: false,
      })
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        date: new Date(viewYear, viewMonth, d),
        isCurrentMonth: true,
      })
    }

    // Next month leading days to fill 42 cells (or 35 if fits)
    const totalCells = cells.length > 35 ? 42 : 35
    const remaining = totalCells - cells.length
    for (let d = 1; d <= remaining; d++) {
      cells.push({
        date: new Date(viewYear, viewMonth + 1, d),
        isCurrentMonth: false,
      })
    }

    return cells
  }, [viewYear, viewMonth])

  const today = new Date()
  const isSameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()

  // Formatted display string in Indonesian DD/MM/YYYY — DD Bulan YYYY
  const displayLabel = useMemo(() => {
    if (!selectedDate && !value) return ''
    const day = activeDate.getDate().toString().padStart(2, '0')
    const month = (activeDate.getMonth() + 1).toString().padStart(2, '0')
    const year = activeDate.getFullYear()
    const monthName = MONTH_SHORT_NAMES[activeDate.getMonth()]
    return `${day}/${month}/${year} (${activeDate.getDate()} ${monthName} ${year})`
  }, [activeDate, selectedDate, value])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      e.preventDefault()
      e.stopPropagation()
      setIsOpen(false)
      triggerRef.current?.focus()
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onKeyDown={handleKeyDown}
    >
      {required && (
        <input
          type="text"
          tabIndex={-1}
          value={value ?? (selectedDate ? formatLocalDate(selectedDate) : '')}
          onChange={() => {}}
          required={required}
          aria-hidden="true"
          className="sr-only pointer-events-none bottom-0 left-1/2"
        />
      )}

      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm md:text-base text-left border rounded-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
          isOpen
            ? 'border-accent ring-2 ring-accent/40'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        }`}
      >
        <span className="truncate">
          {displayLabel || (
            <span className="text-gray-400 dark:text-gray-400">
              {placeholder}
            </span>
          )}
        </span>
        <Calendar
          aria-hidden="true"
          className={`size-4 shrink-0 transition-colors ${
            isOpen ? 'text-accent' : 'text-gray-500 dark:text-gray-300'
          }`}
        />
      </button>

      {/* Portaled Calendar Popup */}
      {isOpen &&
        position &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={popupRef}
            role="dialog"
            aria-label="Pilih tanggal"
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: position.top,
              bottom: position.bottom,
              left: position.left,
              width: 296,
            }}
            className="z-[100] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl overflow-hidden animate-fadeIn select-none"
          >
            {/* Calendar Header */}
            <div className="flex items-center justify-between px-3 py-2.5 bg-gray-50 dark:bg-gray-800/90 border-b border-gray-200 dark:border-gray-700">
              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'days') handlePrevMonth()
                  else if (viewMode === 'months') setViewYear((y) => y - 1)
                  else setYearPageStart((s) => s - 12)
                }}
                aria-label="Sebelumnya"
                className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <ChevronLeft className="size-4" />
              </button>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() =>
                    setViewMode((m) => (m === 'months' ? 'days' : 'months'))
                  }
                  className={`px-2 py-1 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                    viewMode === 'months'
                      ? 'bg-status-info-light text-accent'
                      : 'text-gray-800 dark:text-white hover:bg-gray-200/70 dark:hover:bg-gray-700'
                  }`}
                >
                  {MONTH_NAMES[viewMonth]}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setYearPageStart(Math.floor(viewYear / 12) * 12)
                    setViewMode((m) => (m === 'years' ? 'days' : 'years'))
                  }}
                  className={`px-2 py-1 rounded-md text-sm font-semibold transition-colors cursor-pointer ${
                    viewMode === 'years'
                      ? 'bg-status-info-light text-accent'
                      : 'text-gray-800 dark:text-white hover:bg-gray-200/70 dark:hover:bg-gray-700'
                  }`}
                >
                  {viewMode === 'years'
                    ? `${yearPageStart} - ${yearPageStart + 11}`
                    : viewYear}
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (viewMode === 'days') handleNextMonth()
                  else if (viewMode === 'months') setViewYear((y) => y + 1)
                  else setYearPageStart((s) => s + 12)
                }}
                aria-label="Berikutnya"
                className="p-1.5 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-200/70 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>

            {/* Body: Days View */}
            {viewMode === 'days' && (
              <div className="p-3">
                {/* Day Names */}
                <div className="grid grid-cols-7 mb-1">
                  {DAY_NAMES.map((dayName) => (
                    <div
                      key={dayName}
                      className="text-center text-[11px] font-semibold uppercase text-gray-500 dark:text-gray-400 py-1"
                    >
                      {dayName}
                    </div>
                  ))}
                </div>

                {/* Days Grid */}
                <div className="grid grid-cols-7 gap-0.5">
                  {calendarDays.map(({ date, isCurrentMonth }, idx) => {
                    const isSelected = isSameDay(date, activeDate)
                    const isToday = isSameDay(date, today)

                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDate(date)}
                        className={`h-8 w-full rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                          isSelected
                            ? 'bg-brand-primary text-white font-bold shadow-sm'
                            : isToday
                            ? 'bg-status-info-light text-accent font-bold border border-accent/40'
                            : isCurrentMonth
                            ? 'text-gray-800 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700'
                            : 'text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        {date.getDate()}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Body: Compact 3x4 Months Grid (never fills screen) */}
            {viewMode === 'months' && (
              <div className="p-3 grid grid-cols-3 gap-2">
                {MONTH_SHORT_NAMES.map((mName, idx) => {
                  const isCurrent = idx === viewMonth
                  return (
                    <button
                      key={mName}
                      type="button"
                      onClick={() => {
                        setViewMonth(idx)
                        setViewMode('days')
                      }}
                      className={`py-2.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                        isCurrent
                          ? 'bg-brand-primary text-white'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {mName}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Body: Compact 3x4 Years Grid (never fills screen) */}
            {viewMode === 'years' && (
              <div className="p-3 grid grid-cols-3 gap-2">
                {Array.from({ length: 12 }, (_, i) => yearPageStart + i).map(
                  (yr) => {
                    const isCurrent = yr === viewYear
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => {
                          setViewYear(yr)
                          setViewMode('months')
                        }}
                        className={`py-2.5 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                          isCurrent
                            ? 'bg-brand-primary text-white'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                      >
                        {yr}
                      </button>
                    )
                  }
                )}
              </div>
            )}

            {/* Footer: Quick Select Today */}
            <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800/90 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {activeDate.getDate()} {MONTH_NAMES[activeDate.getMonth()]}{' '}
                {activeDate.getFullYear()}
              </span>
              <button
                type="button"
                onClick={() => handleSelectDate(new Date())}
                className="text-xs font-semibold text-accent hover:text-accent-hover px-2 py-1 rounded hover:bg-status-info-light transition-colors cursor-pointer"
              >
                Hari Ini
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

