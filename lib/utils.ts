import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  // Format manual untuk menghindari Intl issues
  const isNegative = amount < 0
  const formatted = Math.abs(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${isNegative ? '-' : ''}Rp ${formatted}`
}

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  const day = d.getDate().toString().padStart(2, '0')
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const year = d.getFullYear()
  return `${day}/${month}/${year}`
}
