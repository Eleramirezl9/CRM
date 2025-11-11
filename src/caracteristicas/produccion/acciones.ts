'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/compartido/lib/dal'
import { checkPermiso, PERMISOS } from '@/compartido/lib/permisos'

// Registrar producción diaria
export async function registrarProduccion(data: {
  fecha?: Date
  productoId: string
  cantidadContenedores: number
  unidadesPorContenedor: number
  observaciones?: string
}) {
  try {
    const session = await verifySession()

    // ✅ CRÍTICO: Validar permisos granulares
    const permisoCheck = await checkPermiso(PERMISOS.PRODUCCION_CREAR)
    if (!permisoCheck.authorized) {
      return { success: false, error: permisoCheck.error || 'No tienes permisos para registrar producción' }
    }

    // Validaciones
    if (!data.productoId || data.cantidadContenedores <= 0 || data.unidadesPorContenedor <= 0) {
      return { success: false, error: 'Datos inválidos' }
    }

    // Calcular total de unidades
    const totalUnidades = data.cantidadContenedores * data.unidadesPorContenedor

    // Crear o actualizar producción
    const fechaProduccion = data.fecha || new Date()

    const produccion = await prisma.produccionDiaria.upsert({
      where: {
        fecha_productoId: {
          fecha: fechaProduccion,
          productoId: data.productoId,
        },
      },
      update: {
        cantidadContenedores: data.cantidadContenedores,
        unidadesPorContenedor: data.unidadesPorContenedor,
        totalUnidades,
        observaciones: data.observaciones,
      },
      create: {
        fecha: fechaProduccion,
        productoId: data.productoId,
        cantidadContenedores: data.cantidadContenedores,
        unidadesPorContenedor: data.unidadesPorContenedor,
        totalUnidades,
        observaciones: data.observaciones,
        registradoPor: parseInt(session.user.id),
      },
      include: {
        producto: true,
      },
    })

    revalidatePath('/dashboard/produccion')
    return { success: true, produccion }
  } catch (error) {
    console.error('Error al registrar producción:', error)
    return { success: false, error: 'Error al registrar producción' }
  }
}

// Obtener producción diaria
export async function obtenerProduccionDiaria(fecha?: Date) {
  try {
    const fechaConsulta = fecha || new Date()

    const producciones = await prisma.produccionDiaria.findMany({
      where: {
        fecha: fechaConsulta,
      },
      include: {
        producto: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return { success: true, producciones }
  } catch (error) {
    console.error('Error al obtener producción diaria:', error)
    return { success: false, error: 'Error al obtener producción', producciones: [] }
  }
}

// Obtener historial de producción
export async function obtenerHistorialProduccion(filtros?: {
  fechaInicio?: Date
  fechaFin?: Date
  productoId?: string
  enviado?: boolean
}) {
  try {
    const where: any = {}

    if (filtros?.fechaInicio || filtros?.fechaFin) {
      where.fecha = {}
      if (filtros.fechaInicio) {
        where.fecha.gte = filtros.fechaInicio
      }
      if (filtros.fechaFin) {
        where.fecha.lte = filtros.fechaFin
      }
    }

    if (filtros?.productoId) {
      where.productoId = filtros.productoId
    }

    if (filtros?.enviado !== undefined) {
      where.enviado = filtros.enviado
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

    return { success: true, producciones }
  } catch (error) {
    console.error('Error al obtener historial:', error)
    return { success: false, error: 'Error al obtener historial', producciones: [] }
  }
}

// Marcar producción como enviada
export async function marcarComoEnviada(id: string) {
  try {
    await verifySession()

    // ✅ CRÍTICO: Validar permisos granulares
    const permisoCheck = await checkPermiso(PERMISOS.PRODUCCION_EDITAR)
    if (!permisoCheck.authorized) {
      return { success: false, error: permisoCheck.error || 'No tienes permisos para marcar producción como enviada' }
    }

    const produccion = await prisma.produccionDiaria.update({
      where: { id },
      data: { enviado: true },
      include: {
        producto: true,
      },
    })

    revalidatePath('/dashboard/produccion')
    return { success: true, produccion }
  } catch (error) {
    console.error('Error al marcar como enviada:', error)
    return { success: false, error: 'Error al actualizar producción' }
  }
}

// Obtener productos disponibles para producción (no enviados)
export async function obtenerProductosDisponibles() {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const producciones = await prisma.produccionDiaria.findMany({
      where: {
        fecha: hoy,
        enviado: false,
      },
      include: {
        producto: true,
      },
    })

    // Agrupar por producto
    const disponibles = producciones.map(p => ({
      productoId: p.productoId,
      nombre: p.producto.nombre,
      cantidadContenedores: p.cantidadContenedores,
      unidadesPorContenedor: p.unidadesPorContenedor,
      totalUnidades: p.totalUnidades,
      fecha: p.fecha,
    }))

    return { success: true, productos: disponibles }
  } catch (error) {
    console.error('Error al obtener productos disponibles:', error)
    return { success: false, error: 'Error al obtener productos', productos: [] }
  }
}
