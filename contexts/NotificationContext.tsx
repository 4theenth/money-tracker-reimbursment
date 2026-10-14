'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import Toast, { ToastType } from '@/components/ui/Toast'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface ToastData {
  id: string
  message: string
  type: ToastType
  duration?: number
}

interface ConfirmData {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  confirmVariant?: 'danger' | 'primary' | 'success'
  onConfirm: () => void
  onCancel?: () => void
}

interface NotificationContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void
  showSuccess: (message: string) => void
  showError: (message: string) => void
  showWarning: (message: string) => void
  showInfo: (message: string) => void
  confirm: (options: ConfirmData) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([])
  const [confirmDialog, setConfirmDialog] = useState<ConfirmData | null>(null)

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, message, type, duration }])
  }, [])

  const showSuccess = useCallback((message: string) => {
    showToast(message, 'success')
  }, [showToast])

  const showError = useCallback((message: string) => {
    showToast(message, 'error', 5000)
  }, [showToast])

  const showWarning = useCallback((message: string) => {
    showToast(message, 'warning', 4000)
  }, [showToast])

  const showInfo = useCallback((message: string) => {
    showToast(message, 'info')
  }, [showToast])

  const confirm = useCallback((options: ConfirmData) => {
    setConfirmDialog(options)
  }, [])

  const handleConfirm = useCallback(() => {
    if (confirmDialog) {
      confirmDialog.onConfirm()
      setConfirmDialog(null)
    }
  }, [confirmDialog])

  const handleCancel = useCallback(() => {
    if (confirmDialog) {
      confirmDialog.onCancel?.()
      setConfirmDialog(null)
    }
  }, [confirmDialog])

  return (
    <NotificationContext.Provider
      value={{
        showToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
        confirm,
      }}
    >
      {children}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={removeToast}
          />
        ))}
      </div>

      {/* Confirm Dialog */}
      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          confirmLabel={confirmDialog.confirmLabel}
          cancelLabel={confirmDialog.cancelLabel}
          confirmVariant={confirmDialog.confirmVariant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </NotificationContext.Provider>
  )
}

export function useNotification() {
  const context = useContext(NotificationContext)
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}
