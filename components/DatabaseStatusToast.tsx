'use client'

import { useEffect } from 'react'
import { useNotification } from '@/contexts/NotificationContext'

const SESSION_KEY = 'money-tracker:database-status-shown'

export default function DatabaseStatusToast({ categoryCount }: { categoryCount: number }) {
  const { showSuccess } = useNotification()

  useEffect(() => {
    try {
      if (sessionStorage.getItem(SESSION_KEY)) return
      sessionStorage.setItem(SESSION_KEY, '1')
    } catch {
      return
    }
    showSuccess(`Database terhubung, ${categoryCount} kategori tersedia`)
  }, [categoryCount, showSuccess])

  return null
}
