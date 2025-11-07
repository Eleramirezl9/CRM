import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from '@/caracteristicas/autenticacion/server'
import { authOptions } from '@/caracteristicas/autenticacion/server'
import { prisma } from '@/lib/prisma'

// GET: Obtener producción diaria
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const fecha = searchParams.get('fecha')
    const enviado = searchParams.get('enviado')

    // Construir filtro
    const where: any = {}

    if (fecha) {
      where.fecha = new Date(fecha)
    }

    if (enviado !== null) {
      where.enviado = enviado === 'true'
    }

    const producciones = await prisma.produccionDiaria.findMany({
      where,
      include: {
        producto: true,
      },
      orderBy: {
        fecha: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      producciones,
    })
  } catch (error) {
    console.error('Error al obtener producción diaria:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// POST: Registrar nueva producción
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    // Solo usuarios de producción pueden registrar
    if (session.user.rol !== 'produccion' && session.user.rol !== 'admin') {
      return NextResponse.json({
        error: 'No tienes permisos para registrar producción'
      }, { status: 403 })
    }

    const body = await request.json()
    const {
      fecha,
      productoId,
      cantidadContenedores,
      unidadesPorContenedor,
      observaciones
    } = body

    // Validaciones
    if (!productoId || !cantidadContenedores || !unidadesPorContenedor) {
      return NextResponse.json({
        error: 'Faltan campos requeridos'
      }, { status: 400 })
    }

    if (cantidadContenedores <= 0 || unidadesPorContenedor <= 0) {
      return NextResponse.json({
        error: 'Las cantidades deben ser mayores a 0'
      }, { status: 400 })
    }

    // Calcular total de unidades
    const totalUnidades = cantidadContenedores * unidadesPorContenedor

    // Crear o actualizar producción
    const fechaProduccion = fecha ? new Date(fecha) : new Date()

    const produccion = await prisma.produccionDiaria.upsert({
      where: {
        fecha_productoId: {
          fecha: fechaProduccion,
          productoId,
        },
      },
      update: {
        cantidadContenedores,
        unidadesPorContenedor,
        totalUnidades,
        observaciones,
      },
      create: {
        fecha: fechaProduccion,
        productoId,
        cantidadContenedores,
        unidadesPorContenedor,
        totalUnidades,
        observaciones,
        registradoPor: session.user.id,
      },
      include: {
        producto: true,
      },
    })

    return NextResponse.json({
      success: true,
      produccion,
    })
  } catch (error) {
    console.error('Error al registrar producción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

// PUT: Marcar producción como enviada
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession()
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const body = await request.json()
    const { id, enviado } = body

    if (!id) {
      return NextResponse.json({ error: 'ID de producción requerido' }, { status: 400 })
    }

    const produccion = await prisma.produccionDiaria.update({
      where: { id },
      data: { enviado },
      include: {
        producto: true,
      },
    })

    return NextResponse.json({
      success: true,
      produccion,
    })
  } catch (error) {
    console.error('Error al actualizar producción:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
