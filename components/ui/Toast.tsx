'use client'

import { useEffect } from 'react'

export type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastProps {
  id: string
  message: string
  type: ToastType
  duration?: number
  onClose: (id: string) => void
}

export default function Toast({ id, message, type, duration = 3000, onClose }: ToastProps) {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(id)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [id, duration, onClose])

  const styles = {
    success: {
      bg: 'bg-status-success',
      icon: '✓',
      iconBg: 'bg-status-success',
    },
    error: {
      bg: 'bg-status-danger',
      icon: '✕',
      iconBg: 'bg-status-danger',
    },
    warning: {
      bg: 'bg-status-warning',
      icon: '⚠',
      iconBg: 'bg-status-warning',
    },
    info: {
      bg: 'bg-status-info',
      icon: 'ℹ',
      iconBg: 'bg-status-info',
    },
  }

  const style = styles[type]

  return (
    <div
      className={`${style.bg} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[300px] max-w-md animate-slideIn`}
      role="alert"
    >
      <div className={`${style.iconBg} w-8 h-8 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0`}>
        {style.icon}
      </div>
      <p className="flex-1 text-sm font-medium">{message}</p>
      <button
        onClick={() => onClose(id)}
        className="text-white hover:text-gray-200 font-bold text-lg flex-shrink-0"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  )
}
