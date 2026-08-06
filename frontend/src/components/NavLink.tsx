'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isNavLinkActive } from '@/lib/navigation'

interface Props {
  href: string
  label: string
  onNavigate?: () => void
}

export default function NavLink({ href, label, onNavigate }: Props) {
  const pathname = usePathname()
  const active = isNavLinkActive(pathname, href)

  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={`text-sm transition-colors ${
        active
          ? 'text-primary font-medium'
          : 'text-gray-600 hover:text-primary'
      }`}
    >
      {label}
    </Link>
  )
}
