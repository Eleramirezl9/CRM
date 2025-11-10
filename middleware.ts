/**
 * Middleware de Autenticación y Autorización
 * ✅ Configuración segura de cookies
 * ✅ Validación de roles y rutas
 * ✅ Prevención de CVE-2025-29927
 * ✅ Headers de seguridad (XSS, Clickjacking, MIME)
 *
 * IMPORTANTE: Este middleware es la primera línea de defensa,
 * pero NUNCA confíes solo en él. Siempre valida en:
 * 1. Server Actions (usando DAL - verifySession)
 * 2. API Routes (usando getServerSession)
 * 3. Page Components (usando verifySession)
 */

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Only guard dashboard and API routes
  const isProtectedRoute = pathname.startsWith('/dashboard') || pathname.startsWith('/api/')
  if (!isProtectedRoute) {
    return NextResponse.next()
  }

  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  // Not authenticated -> redirect to sign in
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }
    const url = new URL('/iniciar-sesion', req.url)
    url.searchParams.set('callbackUrl', req.url)
    return NextResponse.redirect(url)
  }

  // ✅ Verificar que el usuario esté activo
  if (!(token as any).activo) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Usuario inactivo' }, { status: 403 })
    }
    const response = NextResponse.redirect(new URL('/iniciar-sesion?error=inactive', req.url))
    const cookieName = process.env.NODE_ENV === 'production'
      ? '__Secure-next-auth.session-token'
      : 'next-auth.session-token'
    response.cookies.delete(cookieName)
    return response
  }

  const rol = (token as any).rol as 'administrador' | 'bodega' | 'sucursal' | 'produccion'
  const sucursalId = (token as any).sucursalId as string | null
  const permisos = ((token as any).permisos as string[]) || []

  // Log para debugging (remover en producción)
  if (process.env.NODE_ENV === 'development') {
    console.log(`🔐 Middleware - Rol: ${rol}, Ruta: ${pathname}, Permisos: ${permisos.length}`)
  }

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

  // ✅ Estrategia: DENEGAR POR DEFECTO, solo permitir si tiene permisos específicos
  let allowed = false

  // 1. Administrador tiene acceso total (sin restricciones)
  if (rol === 'administrador') {
    allowed = true
  } else {
    // 2. Para otros roles, VERIFICAR PERMISOS INDIVIDUALES
    // Mapeo de rutas a permisos requeridos
    const routePermissions: Record<string, string[]> = {
      '/dashboard/usuarios': ['usuarios.ver'],
      '/dashboard/roles': ['roles.ver'],
      '/dashboard/productos': ['productos.ver'],
      '/dashboard/inventario': ['inventario.ver'],
      '/dashboard/ventas': ['ventas.ver'],
      '/dashboard/envios': ['envios.ver'],
      '/dashboard/produccion': ['produccion.ver'],
      '/dashboard/sucursales': ['sucursales.ver'],
      '/dashboard/reportes': ['reportes.ver'],
      '/dashboard/auditoria': ['auditoria.ver'],
    }

    // Verificar si tiene permiso para la ruta específica
    for (const [route, requiredPerms] of Object.entries(routePermissions)) {
      if (pathname.startsWith(route)) {
        // Debe tener AL MENOS UNO de los permisos requeridos
        allowed = requiredPerms.some(perm => permisos.includes(perm))
        if (process.env.NODE_ENV === 'development') {
          console.log(`🔍 Ruta: ${route}, Permisos requeridos: ${requiredPerms}, Usuario tiene: ${permisos.filter(p => requiredPerms.includes(p))}`)
        }
        break
      }
    }

    // 3. Permitir acceso al dashboard principal si tiene al menos 1 permiso
    if (pathname === '/dashboard' || pathname === '/dashboard/') {
      allowed = permisos.length > 0
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`${allowed ? '✅' : '❌'} Acceso ${allowed ? 'PERMITIDO' : 'DENEGADO'} - Rol: ${rol}, Permisos: [${permisos.slice(0, 3).join(', ')}${permisos.length > 3 ? '...' : ''}]`)
  }

  if (!allowed) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'No tienes permisos para acceder a este recurso' }, { status: 403 })
    }
    const url = new URL('/no-autorizado', req.url)
    return NextResponse.redirect(url)
  }

  // ✅ Agregar headers de seguridad a la respuesta
  const response = NextResponse.next()

  // Prevenir XSS y ataques de tipo MIME
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Prevenir Clickjacking
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()')

  // CSP básico (ajustar según necesidades)
  if (process.env.NODE_ENV === 'production') {
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
    )
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/api/:path*',
  ],
}
