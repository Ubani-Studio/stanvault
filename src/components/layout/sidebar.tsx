'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { signOut } from 'next-auth/react'

const navItems = [
  { href: '/dashboard', label: 'Overview' },
  { href: '/fans', label: 'Fans' },
  { href: '/roster', label: 'Roster' },
  { href: '/drops', label: 'Drops' },
  { href: '/connections', label: 'Connect' },
  { href: '/campaigns', label: 'Campaigns' },
  { href: '/insights', label: 'Shifts' },
  { href: '/fanprint', label: 'Imprints' },
  { href: '/export', label: 'Export' },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-black border-r border-[#1a1a1a] flex flex-col z-30">
      {/* Logo */}
      <div className="p-6 border-b border-[#1a1a1a]">
        <Link href="/dashboard" className="block">
          <span className="text-2xl text-white" style={{ fontFamily: 'Canela, serif' }}>
            Imprint
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto scrollbar-minimal">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={true}
              className={cn(
                'block px-4 py-3 transition-all duration-200 border-l-2',
                isActive
                  ? 'text-white border-l-accent'
                  : 'text-gray-500 hover:text-white border-transparent'
              )}
            >
              <span style={{ fontFamily: 'Canela, serif' }}>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Bottom section */}
      <div className="p-4 border-t border-[#1a1a1a] space-y-1">
        <Link
          href="/settings"
          className="block px-4 py-3 text-gray-500 hover:text-white transition-all duration-200 border-l-2 border-transparent"
        >
          <span style={{ fontFamily: 'Canela, serif' }}>Settings</span>
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full text-left px-4 py-3 text-gray-500 hover:text-white transition-all duration-200 border-l-2 border-transparent"
        >
          <span style={{ fontFamily: 'Canela, serif' }}>Sign Out</span>
        </button>
      </div>
    </aside>
  )
}
