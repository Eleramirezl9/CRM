'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/compartido/lib/dal'
import { checkPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { detectarTurno, type Turno } from '@/compartido/lib/turnos'
import { registrarAuditoria } from '@/compartido/lib/auditoria'

// Registrar producción diaria
export async function registrarProduccion(data: {
  fecha?: Date
  productoId: string
  cantidadContenedores: number
  unidadesPorContenedor: number
  observaciones?: string
  turno?: Turno
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

    // Detectar turno automáticamente si no se proporciona
    const turno = data.turno || detectarTurno(fechaProduccion)

    const produccion = await prisma.produccionDiaria.upsert({
      where: {
        fecha_productoId_turno: {
          fecha: fechaProduccion,
          productoId: data.productoId,
          turno,
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
        turno,
      },
      include: {
        producto: true,
      },
    })

    // Registrar auditoría
    await registrarAuditoria({
      usuarioId: parseInt(session.user.id),
      accion: 'CREATE_PRODUCCION',
      entidad: 'ProduccionDiaria',
      entidadId: produccion.id,
      detalles: {
        productoId: data.productoId,
        productoNombre: produccion.producto.nombre,
        turno,
        totalUnidades,
        cantidadContenedores: data.cantidadContenedores,
        unidadesPorContenedor: data.unidadesPorContenedor,
      },
    })

    revalidatePath('/dashboard/produccion')
    return { success: true, produccion }
  } catch (error) {
    console.error('Error al registrar producción:', error)

    // Registrar auditoría de error
    try {
      const session = await verifySession()
      await registrarAuditoria({
        usuarioId: parseInt(session.user.id),
        accion: 'CREATE_PRODUCCION',
        entidad: 'ProduccionDiaria',
        detalles: { error: error instanceof Error ? error.message : 'Error desconocido' },
        exitoso: false,
      })
    } catch (auditError) {
      // Ignorar errores de auditoría
    }

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

// Obtener productos disponibles del día (aún no firmados por producción)
export async function obtenerProductosDisponibles() {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const producciones = await prisma.produccionDiaria.findMany({
      where: {
        fecha: hoy,
        enviado: false, // Productos sin firmar
      },
      include: {
        producto: true,
      },
    })

    // Agrupar por producto
    const disponibles = producciones.map(p => ({
      id: p.id,
      productoId: p.productoId,
      nombre: p.producto.nombre,
      cantidadContenedores: p.cantidadContenedores,
      unidadesPorContenedor: p.unidadesPorContenedor,
      totalUnidades: p.totalUnidades,
      fecha: p.fecha,
      turno: p.turno as Turno,
      firmadoPor: p.firmadoPor,
      fechaFirma: p.fechaFirma,
    }))

    return { success: true, productos: disponibles }
  } catch (error) {
    console.error('Error al obtener productos disponibles:', error)
    return { success: false, error: 'Error al obtener productos', productos: [] }
  }
}

// Obtener productos firmados esperando confirmación de bodega
export async function obtenerProductosFirmados() {
  try {
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const producciones = await prisma.produccionDiaria.findMany({
      where: {
        fecha: hoy,
        enviado: true, // Productos firmados
        confirmadoPor: null, // Pero no confirmados por bodega
      },
      include: {
        producto: true,
      },
    })

    const firmados = producciones.map(p => ({
      id: p.id,
      productoId: p.productoId,
      nombre: p.producto.nombre,
      cantidadContenedores: p.cantidadContenedores,
      unidadesPorContenedor: p.unidadesPorContenedor,
      totalUnidades: p.totalUnidades,
      fecha: p.fecha,
      turno: p.turno as Turno,
      firmadoPor: p.firmadoPor,
      fechaFirma: p.fechaFirma,
    }))

    return { success: true, productos: firmados }
  } catch (error) {
    console.error('Error al obtener productos firmados:', error)
    return { success: false, error: 'Error al obtener productos', productos: [] }
  }
}

// Firmar producción para enviar a bodega
export async function firmarProduccion(id: string) {
  try {
    const session = await verifySession()

    const permisoCheck = await checkPermiso(PERMISOS.PRODUCCION_EDITAR)
    if (!permisoCheck.authorized) {
      return { success: false, error: permisoCheck.error || 'No tienes permisos para firmar producción' }
    }

    // Validar ownership: verificar que la producción sea del día actual
    const produccionExistente = await prisma.produccionDiaria.findUnique({
      where: { id },
      include: { producto: true },
    })

    if (!produccionExistente) {
      await registrarAuditoria({
        usuarioId: parseInt(session.user.id),
        accion: 'FIRMAR_PRODUCCION',
        entidad: 'ProduccionDiaria',
        entidadId: id,
        detalles: { error: 'Producción no encontrada' },
        exitoso: false,
      })
      return { success: false, error: 'Producción no encontrada' }
    }

    // Validar que sea del día actual o futuro (no permitir firmar producciones pasadas)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    const fechaProduccion = new Date(produccionExistente.fecha)
    fechaProduccion.setHours(0, 0, 0, 0)

    if (fechaProduccion < hoy) {
      await registrarAuditoria({
        usuarioId: parseInt(session.user.id),
        accion: 'FIRMAR_PRODUCCION',
        entidad: 'ProduccionDiaria',
        entidadId: id,
        detalles: {
          error: 'No se pueden firmar producciones de días anteriores',
          fechaProduccion: produccionExistente.fecha,
        },
        exitoso: false,
      })
      return { success: false, error: 'No se pueden firmar producciones de días anteriores' }
    }

    // Validar que no esté ya firmada
    if (produccionExistente.enviado) {
      return { success: false, error: 'Esta producción ya fue firmada anteriormente' }
    }

    const produccion = await prisma.produccionDiaria.update({
      where: { id },
      data: {
        enviado: true,
        firmadoPor: parseInt(session.user.id),
        fechaFirma: new Date(),
      },
      include: {
        producto: true,
      },
    })

    // Registrar auditoría
    await registrarAuditoria({
      usuarioId: parseInt(session.user.id),
      accion: 'FIRMAR_PRODUCCION',
      entidad: 'ProduccionDiaria',
      entidadId: id,
      detalles: {
        productoId: produccion.productoId,
        productoNombre: produccion.producto.nombre,
        turno: produccion.turno,
        totalUnidades: produccion.totalUnidades,
        fecha: produccion.fecha,
      },
    })

    revalidatePath('/dashboard/produccion')
    revalidatePath('/dashboard/produccion/disponibles')
    return { success: true, produccion }
  } catch (error) {
    console.error('Error al firmar producción:', error)

    // Registrar auditoría de error
    try {
      const session = await verifySession()
      await registrarAuditoria({
        usuarioId: parseInt(session.user.id),
        accion: 'FIRMAR_PRODUCCION',
        entidad: 'ProduccionDiaria',
        entidadId: id,
        detalles: { error: error instanceof Error ? error.message : 'Error desconocido' },
        exitoso: false,
      })
    } catch (auditError) {
      // Ignorar errores de auditoría
    }

    return { success: false, error: 'Error al firmar producción' }
  }
}

// Confirmar recepción en bodega
export async function confirmarRecepcionBodega(id: string) {
  try {
    const session = await verifySession()

    // Verificar permisos de bodega
    const permisoCheck = await checkPermiso(PERMISOS.PRODUCCION_EDITAR)
    if (!permisoCheck.authorized) {
      return { success: false, error: permisoCheck.error || 'No tienes permisos para confirmar recepción' }
    }

    // Validar que la producción existe y está firmada
    const produccionExistente = await prisma.produccionDiaria.findUnique({
      where: { id },
      include: { producto: true },
    })

    if (!produccionExistente) {
      await registrarAuditoria({
        usuarioId: parseInt(session.user.id),
        accion: 'CONFIRMAR_PRODUCCION_BODEGA',
        entidad: 'ProduccionDiaria',
        entidadId: id,
        detalles: { error: 'Producción no encontrada' },
        exitoso: false,
      })
      return { success: false, error: 'Producción no encontrada' }
    }

    // Validar que la producción esté firmada
    if (!produccionExistente.enviado || !produccionExistente.firmadoPor) {
      await registrarAuditoria({
        usuarioId: parseInt(session.user.id),
        accion: 'CONFIRMAR_PRODUCCION_BODEGA',
        entidad: 'ProduccionDiaria',
        entidadId: id,
        detalles: { error: 'Solo se pueden confirmar producciones firmadas' },
        exitoso: false,
      })
      return { success: false, error: 'Solo se pueden confirmar producciones que han sido firmadas por producción' }
    }

    // Validar que no esté ya confirmada
    if (produccionExistente.confirmadoPor) {
      return { success: false, error: 'Esta producción ya fue confirmada anteriormente' }
    }

    const produccion = await prisma.produccionDiaria.update({
      where: { id },
      data: {
        confirmadoPor: parseInt(session.user.id),
        fechaConfirmacion: new Date(),
      },
      include: {
        producto: true,
      },
    })

    // Registrar auditoría
    await registrarAuditoria({
      usuarioId: parseInt(session.user.id),
      accion: 'CONFIRMAR_PRODUCCION_BODEGA',
      entidad: 'ProduccionDiaria',
      entidadId: id,
      detalles: {
        productoId: produccion.productoId,
        productoNombre: produccion.producto.nombre,
        turno: produccion.turno,
        totalUnidades: produccion.totalUnidades,
        fecha: produccion.fecha,
        firmadoPor: produccion.firmadoPor,
      },
    })

    revalidatePath('/dashboard/produccion')
    revalidatePath('/dashboard/produccion/disponibles')
    return { success: true, produccion }
  } catch (error) {
    console.error('Error al confirmar recepción:', error)

    // Registrar auditoría de error
    try {
      const session = await verifySession()
      await registrarAuditoria({
        usuarioId: parseInt(session.user.id),
        accion: 'CONFIRMAR_PRODUCCION_BODEGA',
        entidad: 'ProduccionDiaria',
        entidadId: id,
        detalles: { error: error instanceof Error ? error.message : 'Error desconocido' },
        exitoso: false,
      })
    } catch (auditError) {
      // Ignorar errores de auditoría
    }

    return { success: false, error: 'Error al confirmar recepción' }
  }
}

// Actualizar turno de producción
export async function actualizarTurno(id: string, turno: Turno) {
  try {
    const session = await verifySession()

    const permisoCheck = await checkPermiso(PERMISOS.PRODUCCION_EDITAR)
    if (!permisoCheck.authorized) {
      return { success: false, error: permisoCheck.error || 'No tienes permisos para actualizar el turno' }
    }

    // Validar que la producción existe
    const produccionExistente = await prisma.produccionDiaria.findUnique({
      where: { id },
      include: { producto: true },
    })

    if (!produccionExistente) {
      await registrarAuditoria({
        usuarioId: parseInt(session.user.id),
        accion: 'UPDATE_TURNO_PRODUCCION',
        entidad: 'ProduccionDiaria',
        entidadId: id,
        detalles: { error: 'Producción no encontrada' },
        exitoso: false,
      })
      return { success: false, error: 'Producción no encontrada' }
    }

    // Validar que no esté ya confirmada en bodega
    if (produccionExistente.confirmadoPor) {
      await registrarAuditoria({
        usuarioId: parseInt(session.user.id),
        accion: 'UPDATE_TURNO_PRODUCCION',
        entidad: 'ProduccionDiaria',
        entidadId: id,
        detalles: { error: 'No se puede cambiar el turno de una producción ya confirmada' },
        exitoso: false,
      })
      return { success: false, error: 'No se puede cambiar el turno de una producción ya confirmada en bodega' }
    }

    const turnoAnterior = produccionExistente.turno

    const produccion = await prisma.produccionDiaria.update({
      where: { id },
      data: { turno },
      include: {
        producto: true,
      },
    })

    // Registrar auditoría
    await registrarAuditoria({
      usuarioId: parseInt(session.user.id),
      accion: 'UPDATE_TURNO_PRODUCCION',
      entidad: 'ProduccionDiaria',
      entidadId: id,
      detalles: {
        productoId: produccion.productoId,
        productoNombre: produccion.producto.nombre,
        turnoAnterior,
        turnoNuevo: turno,
        fecha: produccion.fecha,
      },
    })

    revalidatePath('/dashboard/produccion')
    return { success: true, produccion }
  } catch (error) {
    console.error('Error al actualizar turno:', error)

    // Registrar auditoría de error
    try {
      const session = await verifySession()
      await registrarAuditoria({
        usuarioId: parseInt(session.user.id),
        accion: 'UPDATE_TURNO_PRODUCCION',
        entidad: 'ProduccionDiaria',
        entidadId: id,
        detalles: { error: error instanceof Error ? error.message : 'Error desconocido' },
        exitoso: false,
      })
    } catch (auditError) {
      // Ignorar errores de auditoría
    }

    return { success: false, error: 'Error al actualizar turno' }
  }
}

// Migrar producciones sin turno (temporal)
export async function migrarProduccionesSinTurno() {
  try {
    await verifySession()

    // Primero, obtener todos los registros sin turno válido
    const sinTurno = await prisma.produccionDiaria.findMany({
      where: {
        NOT: {
          turno: {
            in: ['manana', 'noche']
          }
        }
      }
    })

    // Actualizar uno por uno para evitar problemas
    let count = 0
    for (const prod of sinTurno) {
      await prisma.produccionDiaria.update({
        where: { id: prod.id },
        data: { turno: 'manana' }
      })
      count++
    }

    revalidatePath('/dashboard/produccion')
    revalidatePath('/dashboard/produccion/disponibles')
    return { success: true, count }
  } catch (error) {
    console.error('Error al migrar:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Error al migrar' }
  }
}
