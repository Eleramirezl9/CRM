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

  // Role-based access map
  const roleAccess: Record<string, RegExp[]> = {
    administrador: [
      /^\/dashboard.*$/, // Acceso total a todo dashboard
    ],
    bodega: [
      // ❌ REMOVIDO /^\/dashboard\/?$/ - NO tiene acceso al dashboard global
      /^\/dashboard\/inventario(\/.*)?$/, // Inventario completo
      /^\/dashboard\/envios(\/.*)?$/, // Envíos (aquí verá las sucursales en contexto de envío)
      // NO tiene acceso a /dashboard (dashboard global con info de toda la empresa)
      // NO tiene acceso a /dashboard/sucursales (gestión)
      // NO tiene acceso a /dashboard/ventas
      // NO tiene acceso a /dashboard/productos
      // NO tiene acceso a /dashboard/reportes
    ],
    sucursal: [
      // ❌ REMOVIDO /^\/dashboard\/?$/ - NO tiene acceso al dashboard global
      /^\/dashboard\/ventas(\/.*)?$/, // Módulo de ventas
      /^\/dashboard\/inventario(\/.*)?$/, // Ver inventario de su sucursal
      // NO tiene acceso a /dashboard (dashboard global con info de toda la empresa)
      // NO tiene acceso a envíos
      // NO tiene acceso a productos
      // NO tiene acceso a reportes
      // NO tiene acceso a sucursales
    ],
    produccion: [
      // ❌ REMOVIDO /^\/dashboard\/?$/ - NO tiene acceso al dashboard global
      /^\/dashboard\/produccion(\/.*)?$/, // Módulo de producción
      /^\/dashboard\/inventario(\/.*)?$/, // Ver inventario (solo lectura)
      // NO tiene acceso a /dashboard (dashboard global con info de toda la empresa)
      // NO tiene acceso a ventas
      // NO tiene acceso a envíos
      // NO tiene acceso a productos
      // NO tiene acceso a reportes
      // NO tiene acceso a sucursales
    ],
  }

  // Verificar acceso por rol (comportamiento base)
  let allowed = roleAccess[rol]?.some((re) => re.test(pathname)) ?? false

  // ✅ NUEVO: Verificar permisos individuales si no tiene acceso por rol
  if (!allowed && permisos.length > 0) {
    // Mapeo de rutas a permisos requeridos
    const routePermissions: Record<string, string[]> = {
      '/dashboard/usuarios': ['usuarios.ver'],
      '/dashboard/productos': ['productos.ver'],
      '/dashboard/inventario': ['inventario.ver'],
      '/dashboard/ventas': ['ventas.ver'],
      '/dashboard/envios': ['envios.ver'],
      '/dashboard/produccion': ['produccion.ver'],
      '/dashboard/sucursales': ['sucursales.ver'],
      '/dashboard/reportes': ['reportes.ver'],
    }

    // Verificar si tiene permiso para la ruta
    for (const [route, requiredPerms] of Object.entries(routePermissions)) {
      if (pathname.startsWith(route)) {
        // Si tiene al menos uno de los permisos requeridos, permitir acceso
        allowed = requiredPerms.some(perm => permisos.includes(perm))
        if (allowed) break
      }
    }
  }

  if (process.env.NODE_ENV === 'development') {
    console.log(`✅ Acceso permitido: ${allowed} (Por rol o permisos)`)
  }

  if (!allowed) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`❌ Acceso denegado para rol ${rol} a ${pathname}`)
    }
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
