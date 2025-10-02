import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  // Only guard dashboard
  if (!pathname.startsWith('/dashboard')) return NextResponse.next()

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  // Not authenticated -> redirect to sign in
  if (!token) {
    const url = new URL('/iniciar-sesion', req.url)
    url.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(url)
  }

  const rol = (token as any).rol as 'administrador' | 'bodega' | 'sucursal'

  // Role-based access map
  const roleAccess: Record<string, RegExp[]> = {
    administrador: [
      /^\/dashboard(\/.*)?$/,
    ],
    bodega: [
      /^\/dashboard(\/)?$/,
      /^\/dashboard\/inventario(\/.*)?$/,
      /^\/dashboard\/envios(\/.*)?$/,
    ],
    sucursal: [
      /^\/dashboard(\/)?$/,
      /^\/dashboard\/ventas(\/.*)?$/,
      /^\/dashboard\/inventario(\/.*)?$/,
    ],
  }

  const allowed = roleAccess[rol]?.some((re) => re.test(pathname)) ?? false
  if (!allowed) {
    const url = new URL('/no-autorizado', req.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
