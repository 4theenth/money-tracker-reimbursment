'use client'

import { useSyncExternalStore } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import {
  getThemePreference,
  setThemePreference,
  subscribeToThemePreference,
  type ThemePreference,
} from '@/lib/theme'

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Terang', Icon: Sun },
  { value: 'system', label: 'Sistem', Icon: Monitor },
  { value: 'dark', label: 'Gelap', Icon: Moon },
]

export default function ThemeToggle() {
  const preference = useSyncExternalStore(
    subscribeToThemePreference,
    getThemePreference,
    () => 'system' as ThemePreference,
  )

  return (
    <div role="group" aria-label="Mode tampilan">
      <p className="text-xs font-medium text-ink-muted mb-1.5">Mode tampilan</p>
      <div className="grid grid-cols-3 gap-1 rounded-lg bg-paper p-1">
        {OPTIONS.map(({ value, label, Icon }) => {
          const selected = preference === value
          return (
            <button
              key={value}
              type="button"
              aria-pressed={selected}
              onClick={() => setThemePreference(value)}
              className={`flex flex-col items-center gap-0.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
                selected
                  ? 'bg-surface text-accent shadow-sm'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
