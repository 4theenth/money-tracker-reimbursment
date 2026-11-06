'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import * as Dialog from '@radix-ui/react-dialog'
import {
  BookOpen,
  Building2,
  ChartPie,
  LayoutDashboard,
  Menu,
  PiggyBank,
  Tags,
  Wallet,
  X,
} from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'
import { startThemeSync } from '@/lib/theme'

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/transaksi', label: 'Transaksi', Icon: Wallet },
  { href: '/kategori', label: 'Kategori', Icon: Tags },
  { href: '/tabungan', label: 'Tabungan', Icon: PiggyBank },
  { href: '/tabungan/buku', label: 'Buku Tabungan', Icon: BookOpen },
  { href: '/budget', label: 'Anggaran', Icon: ChartPie },
  { href: '/reimbursement', label: 'Reimbursement', Icon: Building2 },
]

function isActive(href: string, pathname: string) {
  // The emoji manager is reached from Kategori and has no menu item of its own
  if (href === '/kategori') return pathname.startsWith('/kategori') || pathname.startsWith('/admin/emoji-manager')
  return pathname === href
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname()

  return (
    <>
      <nav aria-label="Menu utama" className="flex-1 overflow-y-auto px-3 py-2">
        <ul className="space-y-1">
          {NAV_ITEMS.map(({ href, label, Icon }) => {
            const active = isActive(href, pathname)
            return (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onNavigate}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-status-info-light text-accent font-semibold'
                      : 'text-ink-muted hover:bg-paper hover:text-ink'
                  }`}
                >
                  <Icon aria-hidden="true" className="size-5 shrink-0" />
                  {label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <ThemeToggle />
      </div>
    </>
  )
}

export default function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => startThemeSync(), [])

  return (
    <div className="flex-1 min-w-0">
      <aside className="hidden lg:flex flex-col fixed inset-y-0 left-0 z-30 w-60 bg-surface border-r border-gray-200 dark:border-gray-700 print:hidden">
        <Link href="/" className="block px-6 pt-6 pb-4 text-lg font-bold text-ink">
          Money Tracker
        </Link>
        <SidebarContent />
      </aside>

      <header className="lg:hidden sticky top-0 z-30 flex h-14 items-center justify-between gap-3 px-4 bg-surface border-b border-gray-200 dark:border-gray-700 print:hidden">
        <Link href="/" className="font-bold text-ink">Money Tracker</Link>
        <Dialog.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Dialog.Trigger
            aria-label="Buka menu"
            className="flex size-11 items-center justify-center rounded-lg text-ink -mr-2"
          >
            <Menu aria-hidden="true" className="size-6" />
          </Dialog.Trigger>
          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
            <Dialog.Content
              aria-describedby={undefined}
              className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-surface shadow-lg"
            >
              <div className="flex h-14 items-center justify-between px-6 shrink-0">
                <Dialog.Title className="font-bold text-ink">Money Tracker</Dialog.Title>
                <Dialog.Close
                  aria-label="Tutup menu"
                  className="flex size-11 items-center justify-center rounded-lg text-ink -mr-3"
                >
                  <X aria-hidden="true" className="size-6" />
                </Dialog.Close>
              </div>
              <SidebarContent onNavigate={() => setMenuOpen(false)} />
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </header>

      <main className="lg:pl-60 print:pl-0 min-w-0">{children}</main>
    </div>
  )
}
