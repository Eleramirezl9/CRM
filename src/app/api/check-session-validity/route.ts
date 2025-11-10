/**
 * API Route: Verificar Validez de Sesión
 *
 * Este endpoint permite a los clientes verificar si deben refrescar
 * su sesión debido a cambios en los permisos.
 *
 * Se llama desde el componente SessionRefresher cada 5 segundos.
 *
 * @route GET /api/check-session-validity
 * @returns { shouldRefresh: boolean }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/caracteristicas/autenticacion/auth'
import { verificarSesionInvalidada } from '@/compartido/lib/invalidar-sesion'
import { checkRateLimit } from '@/compartido/lib/rate-limit'

export async function GET(request: NextRequest) {
  try {
    // Verificar que el usuario esté autenticado
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      )
    }

    const userId = parseInt(session.user.id)

    // ✅ Rate limiting: 30 checks por minuto (cada 2 segundos)
    const rateLimitResult = await checkRateLimit(`check-session:${userId}`, {
      windowMs: 60 * 1000, // 1 minuto
      max: 30, // Máximo 30 requests por minuto
    })

    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Demasiados requests. Intenta de nuevo en unos segundos.' },
        { status: 429 }
      )
    }

    // Verificar si la sesión fue invalidada
    const shouldRefresh = await verificarSesionInvalidada(userId)

    // Headers de caché: no cachear esta respuesta (es dinámica)
    return NextResponse.json(
      { shouldRefresh },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      }
    )
  } catch (error) {
    console.error('Error al verificar validez de sesión:', error)

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
