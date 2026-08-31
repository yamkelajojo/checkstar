'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { isNavLinkActive } from '@/lib/navigation'

import { startNavigation } from '@/lib/navigation/transition-service';

interface Props {
  href: string
  label: string
  onNavigate?: () => void
}

export default function NavLink({ href, label, onNavigate }: Props) {
  const pathname = usePathname()
  const active = isNavLinkActive(pathname, href)

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onNavigate?.();
    // Trigger navigation lifecycle for smooth transition
    startNavigation();
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
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
