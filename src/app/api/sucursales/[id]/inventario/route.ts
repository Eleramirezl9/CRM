import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/caracteristicas/autenticacion/server'
import { authOptions } from '@/caracteristicas/autenticacion/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const sucursalId = params.id

    // Verificar acceso a la sucursal
    if (session.user.rol === 'sucursal' && session.user.sucursalId !== sucursalId) {
      return NextResponse.json({ error: 'No tienes acceso a esta sucursal' }, { status: 403 })
    }

    // Obtener inventario de la sucursal
    const inventarios = await prisma.inventario.findMany({
      where: {
        sucursalId,
        cantidadActual: { gt: 0 }, // Solo productos con stock
      },
      include: {
        producto: true,
      },
      orderBy: {
        producto: {
          nombre: 'asc',
        },
      },
    })

    return NextResponse.json({
      success: true,
      productos: inventarios,
    })
  } catch (error) {
    console.error('Error al obtener inventario:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
