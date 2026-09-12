import { NextRequest, NextResponse } from 'next/server'

const PROTECTED_ROUTES = ['/account', '/admin', '/rider', '/operations']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = PROTECTED_ROUTES.some(route => pathname.startsWith(route))
  if (!isProtected) {
    return NextResponse.next()
  }

  const session = request.cookies.get('checkstar_session')?.value
    || request.cookies.get('laravel_session')?.value
    || request.cookies.get('sanctum_session')?.value

  if (!session) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*', '/admin/:path*', '/rider/:path*', '/operations/:path*'],
}
