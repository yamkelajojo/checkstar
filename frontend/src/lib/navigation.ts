export const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/products', label: 'Products' },
  { href: '/specials', label: 'Specials' },
  { href: '/recipes', label: 'Recipes' },
  { href: '/community', label: 'Community' },
  { href: '/stores', label: 'Stores' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
] as const

export function isNavLinkActive(pathname: string, href: string): boolean {
  if (href === '/') {
    return pathname === '/'
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}
