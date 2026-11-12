'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Check, Search, X } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
  icon?: string | null
}

interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  searchable?: boolean
  searchPlaceholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  triggerClassName?: string
  size?: 'sm' | 'md'
  ariaLabel?: string
}

interface DropdownPosition {
  top?: number
  bottom?: number
  left: number
  width: number
  listMaxHeight: number
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = 'Pilih opsi...',
  searchable,
  searchPlaceholder = 'Cari...',
  required = false,
  disabled = false,
  className = '',
  triggerClassName = '',
  size = 'md',
  ariaLabel,
}: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [position, setPosition] = useState<DropdownPosition | null>(null)

  const containerRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Automatically enable search when there are more than 7 options unless explicitly set
  const showSearch = searchable ?? options.length > 7

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  )

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options
    const q = searchQuery.toLowerCase().trim()
    return options.filter((opt) => opt.label.toLowerCase().includes(q))
  }, [options, searchQuery])

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth
    const gap = 6
    const searchHeaderHeight = showSearch ? 54 : 12
    const idealListHeight = 224 // ~6-7 items max so it never fills the screen

    const spaceBelow = viewportHeight - rect.bottom - gap - 12
    const spaceAbove = rect.top - gap - 12

    const openUpward =
      spaceBelow < 180 && spaceAbove > spaceBelow

    const availableSpace = openUpward ? spaceAbove : spaceBelow
    const listMaxHeight = Math.max(
      110,
      Math.min(idealListHeight, availableSpace - searchHeaderHeight)
    )

    const minWidth = Math.max(rect.width, showSearch ? 180 : 120)
    const left = Math.min(
      Math.max(8, rect.left),
      Math.max(8, viewportWidth - minWidth - 8)
    )

    if (openUpward) {
      setPosition({
        bottom: viewportHeight - rect.top + gap,
        left,
        width: minWidth,
        listMaxHeight,
      })
    } else {
      setPosition({
        top: rect.bottom + gap,
        left,
        width: minWidth,
        listMaxHeight,
      })
    }
  }, [showSearch])

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node
      if (
        containerRef.current &&
        !containerRef.current.contains(target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(target)
      ) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  // Update position on open, scroll, or resize
  useEffect(() => {
    if (!isOpen) return

    updatePosition()

    const handleScrollOrResize = (e: Event) => {
      // Do not recalculate if scrolling inside the dropdown list itself
      if (
        dropdownRef.current &&
        e.target instanceof Node &&
        dropdownRef.current.contains(e.target)
      ) {
        return
      }
      updatePosition()
    }

    window.addEventListener('resize', handleScrollOrResize)
    window.addEventListener('scroll', handleScrollOrResize, true)
    return () => {
      window.removeEventListener('resize', handleScrollOrResize)
      window.removeEventListener('scroll', handleScrollOrResize, true)
    }
  }, [isOpen, updatePosition])

  // Focus search input or scroll selected item into view when opened
  useEffect(() => {
    if (isOpen) {
      const currentIdx = filteredOptions.findIndex((opt) => opt.value === value)
      setHighlightedIndex(currentIdx >= 0 ? currentIdx : 0)

      requestAnimationFrame(() => {
        if (showSearch) {
          searchInputRef.current?.focus()
        }
        if (listRef.current && currentIdx >= 0) {
          const itemEl = listRef.current.children[currentIdx] as
            | HTMLElement
            | undefined
          if (itemEl) {
            itemEl.scrollIntoView({ block: 'nearest' })
          }
        }
      })
    } else {
      setSearchQuery('')
    }
  }, [isOpen, showSearch])

  // Reset highlighted index when search query changes
  useEffect(() => {
    if (isOpen) {
      setHighlightedIndex(filteredOptions.length > 0 ? 0 : -1)
    }
  }, [searchQuery, filteredOptions.length, isOpen])

  const handleSelect = (optionValue: string) => {
    onChange(optionValue)
    setIsOpen(false)
    setSearchQuery('')
    triggerRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      setIsOpen(false)
      setSearchQuery('')
      triggerRef.current?.focus()
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (filteredOptions.length === 0) return
      const nextIdx = (highlightedIndex + 1) % filteredOptions.length
      setHighlightedIndex(nextIdx)
      const itemEl = listRef.current?.children[nextIdx] as
        | HTMLElement
        | undefined
      itemEl?.scrollIntoView({ block: 'nearest' })
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (filteredOptions.length === 0) return
      const prevIdx =
        highlightedIndex <= 0
          ? filteredOptions.length - 1
          : highlightedIndex - 1
      setHighlightedIndex(prevIdx)
      const itemEl = listRef.current?.children[prevIdx] as
        | HTMLElement
        | undefined
      itemEl?.scrollIntoView({ block: 'nearest' })
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        handleSelect(filteredOptions[highlightedIndex].value)
      }
    }
  }

  const sizeClasses =
    size === 'sm' ? 'px-3 py-1.5 text-sm' : 'px-3 py-2 text-sm md:text-base'

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input for native HTML form required validation */}
      {required && (
        <input
          type="text"
          tabIndex={-1}
          value={value}
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
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between gap-2 text-left border rounded-lg transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
          isOpen
            ? 'border-accent ring-2 ring-accent/40'
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
        } ${sizeClasses} ${triggerClassName}`}
      >
        <span className="flex items-center gap-2 min-w-0 truncate">
          {selectedOption ? (
            <>
              {selectedOption.icon && (
                <span className="shrink-0 leading-none">
                  {selectedOption.icon}
                </span>
              )}
              <span className="truncate">{selectedOption.label}</span>
            </>
          ) : (
            <span className="text-gray-400 dark:text-gray-400 truncate">
              {placeholder}
            </span>
          )}
        </span>

        <ChevronDown
          aria-hidden="true"
          className={`size-4 shrink-0 text-gray-500 dark:text-gray-300 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-accent' : ''
          }`}
        />
      </button>

      {/* Portaled Dropdown Menu */}
      {isOpen &&
        position &&
        typeof document !== 'undefined' &&
        createPortal(
          <div
            ref={dropdownRef}
            role="listbox"
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'fixed',
              top: position.top,
              bottom: position.bottom,
              left: position.left,
              width: position.width,
            }}
            className="z-[100] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-2xl overflow-hidden animate-fadeIn"
          >
            {/* Optional Search Input */}
            {showSearch && (
              <div className="p-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/95">
                <div className="relative flex items-center">
                  <Search
                    aria-hidden="true"
                    className="size-4 absolute left-2.5 text-gray-400 dark:text-gray-400 pointer-events-none"
                  />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={searchPlaceholder}
                    className="w-full pl-8 pr-7 py-1.5 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:border-accent"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        searchInputRef.current?.focus()
                      }}
                      aria-label="Hapus pencarian"
                      className="absolute right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Scrollable Options List - capped height so it never fills the screen */}
            <div
              ref={listRef}
              style={{ maxHeight: position.listMaxHeight }}
              className="overflow-y-auto p-1.5 space-y-0.5 overscroll-contain custom-scrollbar"
            >
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                  Tidak ditemukan
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === value
                  const isHighlighted = idx === highlightedIndex

                  return (
                    <button
                      key={`${opt.value}-${idx}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setHighlightedIndex(idx)}
                      onClick={() => handleSelect(opt.value)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-status-info-light text-accent font-semibold'
                          : isHighlighted
                          ? 'bg-gray-100 dark:bg-gray-700/80 text-gray-900 dark:text-white'
                          : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/70'
                      }`}
                    >
                      <span className="flex items-center gap-2.5 min-w-0">
                        {opt.icon && (
                          <span className="text-base shrink-0 leading-none">
                            {opt.icon}
                          </span>
                        )}
                        <span className="truncate">{opt.label}</span>
                      </span>
                      {isSelected && (
                        <Check
                          aria-hidden="true"
                          className="size-4 shrink-0 text-accent"
                        />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
