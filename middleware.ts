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
  const sucursalId = (token as any).sucursalId as string | null

  // Control de acceso específico para sucursales
  if (rol === 'sucursal' && pathname.includes('/sucursales/')) {
    // Extraer ID de sucursal de la URL
    const sucursalMatch = pathname.match(/\/sucursales\/([^\/]+)/)
    if (sucursalMatch) {
      const routeSucursalId = sucursalMatch[1]
      
      // Si no tiene sucursal asignada o no coincide con la ruta
      if (!sucursalId || routeSucursalId !== sucursalId) {
        const url = new URL('/no-autorizado', req.url)
        return NextResponse.redirect(url)
      }
    }
  }

  // Role-based access map
  const roleAccess: Record<string, RegExp[]> = {
    administrador: [
      /^\/dashboard(\/.*)?$/, // Acceso total
    ],
    bodega: [
      /^\/dashboard(\/)?$/,
      /^\/dashboard\/inventario(\/.*)?$/,
      /^\/dashboard\/envios(\/.*)?$/,
      /^\/dashboard\/sucursales(\/.*)?$/, // Puede ver todas las sucursales para envíos
    ],
    sucursal: [
      /^\/dashboard(\/)?$/,
      /^\/dashboard\/ventas(\/.*)?$/,
      /^\/dashboard\/inventario(\/.*)?$/,
      /^\/dashboard\/sucursales\/[^\/]+\/perfil(\/.*)?$/, // Solo su propia sucursal
      /^\/dashboard\/mi-sucursal(\/.*)?$/, // Redirigir a su sucursal
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
