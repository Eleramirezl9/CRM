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
  forzarNuevo?: boolean  // Nueva opción para forzar crear producto duplicado
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

    // Detectar turno automáticamente si no se proporciona
    const ahora = new Date()
    const turno = data.turno || detectarTurno(ahora)

    // Calcular fecha de producción según turno
    let fechaProduccion = data.fecha ? new Date(data.fecha) : new Date()

    if (!data.fecha) {
      const hora = ahora.getHours()

      if (turno === 'noche') {
        // Turno noche: 5PM-3AM
        // Si es entre 5PM y 11:59PM (17-23), la fecha es mañana
        // Si es entre 12AM y 3AM (0-3), la fecha es hoy (ya pasó la medianoche)
        if (hora >= 17) {
          // Es noche del día actual, producción para mañana
          fechaProduccion.setDate(fechaProduccion.getDate() + 1)
        }
        // Si hora < 4 (madrugada), la fecha ya es correcta (hoy)
      }
      // Turno mañana (4AM-4PM): fecha es hoy, no hay cambio
    }

    // Normalizar a solo fecha (sin hora)
    fechaProduccion.setHours(0, 0, 0, 0)

    // NUEVO: Verificar si ya existe una producción para este producto/fecha/turno con numeroSecuencia = 1
    const produccionExistente = await prisma.produccionDiaria.findFirst({
      where: {
        fecha: fechaProduccion,
        productoId: data.productoId,
        turno,
        numeroSecuencia: 1, // Solo verificar la primera
      },
      include: {
        producto: true,
      },
    })

    // Si existe y no se forzó crear uno nuevo, retornar indicando que ya existe
    if (produccionExistente && !data.forzarNuevo) {
      return {
        success: false,
        error: 'DUPLICATE_FOUND',
        existente: {
          id: produccionExistente.id,
          productoNombre: produccionExistente.producto.nombre,
          cantidadContenedores: produccionExistente.cantidadContenedores,
          unidadesPorContenedor: produccionExistente.unidadesPorContenedor,
          totalUnidades: produccionExistente.totalUnidades,
          firmado: produccionExistente.enviado,
        }
      }
    }

    // Si se forzó crear nuevo O no existe, crear un nuevo registro
    let produccion

    if (data.forzarNuevo && produccionExistente) {
      // Obtener el máximo número de secuencia actual para este producto/fecha/turno
      const maxSecuencia = await prisma.produccionDiaria.findFirst({
        where: {
          fecha: fechaProduccion,
          productoId: data.productoId,
          turno,
        },
        orderBy: {
          numeroSecuencia: 'desc',
        },
        select: {
          numeroSecuencia: true,
        },
      })

      const nuevoNumeroSecuencia = (maxSecuencia?.numeroSecuencia || 0) + 1

      // Crear nueva producción con sufijo en observaciones
      const sufijo = `#${nuevoNumeroSecuencia}`
      const observacionesConSufijo = data.observaciones
        ? `${sufijo} - ${data.observaciones}`
        : `Producción adicional ${sufijo}`

      produccion = await prisma.produccionDiaria.create({
        data: {
          fecha: fechaProduccion,
          productoId: data.productoId,
          numeroSecuencia: nuevoNumeroSecuencia,
          cantidadContenedores: data.cantidadContenedores,
          unidadesPorContenedor: data.unidadesPorContenedor,
          totalUnidades,
          observaciones: observacionesConSufijo,
          registradoPor: parseInt(session.user.id),
          turno,
        },
        include: {
          producto: true,
        },
      })
    } else {
      // Crear normalmente con numeroSecuencia = 1
      produccion = await prisma.produccionDiaria.create({
        data: {
          fecha: fechaProduccion,
          productoId: data.productoId,
          numeroSecuencia: 1,
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
    }

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
        duplicado: data.forzarNuevo || false,
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
    const ahora = new Date()

    // Usar UTC para consistencia con las fechas guardadas
    const hoy = new Date(Date.UTC(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
      0, 0, 0, 0
    ))

    // Ayer
    const ayer = new Date(hoy)
    ayer.setUTCDate(ayer.getUTCDate() - 1)

    // Mañana
    const manana = new Date(hoy)
    manana.setUTCDate(manana.getUTCDate() + 1)

    // Mostrar producciones de ayer (pendientes), hoy y mañana (para turno noche)
    const fechasAMostrar = [ayer, hoy, manana]

    console.log('Buscando producciones para fechas:', fechasAMostrar.map(f => f.toISOString()))

    const producciones = await prisma.produccionDiaria.findMany({
      where: {
        fecha: {
          in: fechasAMostrar
        },
      },
      include: {
        producto: true,
      },
      orderBy: [
        { fecha: 'desc' },
        { turno: 'asc' }, // mañana primero, luego noche
        { createdAt: 'desc' },
      ],
    })

    console.log('Producciones encontradas:', producciones.map(p => ({
      nombre: p.producto.nombre,
      fecha: p.fecha,
      turno: p.turno
    })))

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
    // Verificar sesión y permisos
    await verifySession()

    const permisoCheck = await checkPermiso(PERMISOS.PRODUCCION_VER)
    if (!permisoCheck.authorized) {
      return { success: false, error: permisoCheck.error || 'No tienes permisos para ver el historial', producciones: [] }
    }

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
    // Verificar permisos de bodega
    const permisoCheck = await checkPermiso(PERMISOS.BODEGA_VER)
    if (!permisoCheck.authorized) {
      return { success: false, error: 'Sin permisos para ver productos de bodega', productos: [] }
    }

    const ahora = new Date()

    // Usar UTC para consistencia con las fechas guardadas
    const hoy = new Date(Date.UTC(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
      0, 0, 0, 0
    ))

    // Ayer
    const ayer = new Date(hoy)
    ayer.setUTCDate(ayer.getUTCDate() - 1)

    // Mañana
    const manana = new Date(hoy)
    manana.setUTCDate(manana.getUTCDate() + 1)

    // Buscar producciones de ayer, hoy y mañana
    const fechasABuscar = [ayer, hoy, manana]

    const producciones = await prisma.produccionDiaria.findMany({
      where: {
        fecha: {
          in: fechasABuscar
        },
        enviado: true, // Productos firmados
        confirmadoPor: null, // Pero no confirmados por bodega
      },
      include: {
        producto: true,
        usuarioFirma: {
          select: {
            nombre: true,
            correo: true,
          }
        },
      },
      orderBy: [
        { fecha: 'desc' },
        { turno: 'asc' },
      ],
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
      usuarioFirma: p.usuarioFirma,
    }))

    return { success: true, productos: firmados }
  } catch (error) {
    console.error('Error al obtener productos firmados:', error)
    return { success: false, error: 'Error al obtener productos', productos: [] }
  }
}

// Obtener historial de recepciones confirmadas en bodega
export async function obtenerHistorialBodega() {
  try {
    // Verificar permisos de bodega
    const permisoCheck = await checkPermiso(PERMISOS.BODEGA_VER)
    if (!permisoCheck.authorized) {
      return { success: false, error: 'Sin permisos para ver historial de bodega', historial: [] }
    }

    const producciones = await prisma.produccionDiaria.findMany({
      where: {
        confirmadoPor: { not: null }, // Solo productos confirmados
      },
      include: {
        producto: true,
        usuarioFirma: {
          select: {
            nombre: true,
            correo: true,
          }
        },
        usuarioConfirmacion: {
          select: {
            nombre: true,
            correo: true,
          }
        },
      },
      orderBy: {
        fechaConfirmacion: 'desc',
      },
      take: 50, // Últimos 50 registros
    })

    const historial = producciones.map(p => ({
      id: p.id,
      nombre: p.producto.nombre,
      totalUnidades: p.totalUnidades,
      fecha: p.fecha,
      turno: p.turno as Turno,
      firmadoPor: p.usuarioFirma,
      fechaFirma: p.fechaFirma,
      confirmadoPor: p.usuarioConfirmacion,
      fechaConfirmacion: p.fechaConfirmacion,
    }))

    console.log('Historial bodega:', historial.map(h => ({
      nombre: h.nombre,
      firmadoPor: h.firmadoPor,
      confirmadoPor: h.confirmadoPor
    })))

    return { success: true, historial }
  } catch (error) {
    console.error('Error al obtener historial de bodega:', error)
    return { success: false, error: 'Error al obtener historial', historial: [] }
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

    // Validar que sea del día actual o día siguiente (para turno noche)
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)

    const manana = new Date(hoy)
    manana.setDate(manana.getDate() + 1)

    const fechaProduccion = new Date(produccionExistente.fecha)
    fechaProduccion.setHours(0, 0, 0, 0)

    // Permitir firmar: hoy, mañana (para turno noche), o ayer (por si acaso)
    const ayer = new Date(hoy)
    ayer.setDate(ayer.getDate() - 1)

    const esValida = fechaProduccion >= ayer && fechaProduccion <= manana

    if (!esValida) {
      await registrarAuditoria({
        usuarioId: parseInt(session.user.id),
        accion: 'FIRMAR_PRODUCCION',
        entidad: 'ProduccionDiaria',
        entidadId: id,
        detalles: {
          error: 'No se pueden firmar producciones fuera del rango permitido',
          fechaProduccion: produccionExistente.fecha,
          hoy: hoy,
        },
        exitoso: false,
      })
      return { success: false, error: 'Solo se pueden firmar producciones de hoy, ayer o mañana (turno noche)' }
    }

    // Validar que no esté ya firmada
    if (produccionExistente.enviado) {
      return { success: false, error: 'Esta producción ya fue firmada anteriormente' }
    }

    console.log('Firmando producción con usuario ID:', session.user.id, 'parseado:', parseInt(session.user.id))

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

    console.log('Producción firmada, firmadoPor guardado:', produccion.firmadoPor)

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
    revalidatePath('/dashboard/bodega')
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

// Confirmar recepción en bodega y registrar en inventario
export async function confirmarRecepcionBodega(id: string, sucursalId?: string) {
  try {
    const session = await verifySession()

    // Verificar permisos de bodega
    const permisoCheck = await checkPermiso(PERMISOS.BODEGA_CONFIRMAR)
    if (!permisoCheck.authorized) {
      return { success: false, error: permisoCheck.error || 'No tienes permisos para confirmar recepción en bodega' }
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

    // Registrar en inventario automáticamente
    let inventarioActualizado = null
    if (sucursalId) {
      try {
        // Buscar o crear inventario para este producto en la sucursal
        let inventario = await prisma.inventario.findUnique({
          where: {
            sucursalId_productoId: {
              sucursalId,
              productoId: produccion.productoId,
            },
          },
        })

        if (!inventario) {
          // Crear inventario si no existe
          inventario = await prisma.inventario.create({
            data: {
              sucursalId,
              productoId: produccion.productoId,
              cantidadActual: 0,
              stockMinimo: 10, // valor por defecto
            },
          })
        }

        // Actualizar cantidad y registrar movimiento
        inventarioActualizado = await prisma.$transaction(async (tx) => {
          const invActualizado = await tx.inventario.update({
            where: { id: inventario!.id },
            data: {
              cantidadActual: {
                increment: produccion.totalUnidades,
              },
            },
          })

          // Registrar movimiento de entrada
          await tx.movimientoInventario.create({
            data: {
              inventarioId: inventario!.id,
              productoId: produccion.productoId,
              tipo: 'entrada',
              cantidad: produccion.totalUnidades,
              motivo: `Entrada desde producción - Turno ${produccion.turno === 'manana' ? 'Mañana' : 'Noche'} - ${new Date(produccion.fecha).toLocaleDateString()}`,
              creadorId: parseInt(session.user.id),
            },
          })

          return invActualizado
        })

        console.log('Inventario actualizado:', {
          sucursalId,
          productoId: produccion.productoId,
          cantidadAgregada: produccion.totalUnidades,
          nuevaCantidad: inventarioActualizado.cantidadActual,
        })
      } catch (invError) {
        console.error('Error al actualizar inventario:', invError)
        // No fallar la confirmación por error de inventario
      }
    }

    // Registrar auditoría
    try {
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
          sucursalId,
          inventarioActualizado: inventarioActualizado ? true : false,
        },
      })
    } catch (auditError) {
      console.error('Error al registrar auditoría:', auditError)
    }

    revalidatePath('/dashboard/produccion')
    revalidatePath('/dashboard/produccion/disponibles')
    revalidatePath('/dashboard/bodega')
    revalidatePath('/dashboard/inventario')
    return { success: true, produccion, inventarioActualizado }
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

    // Recalcular fecha según el nuevo turno
    const ahora = new Date()
    const hora = ahora.getHours()

    // Crear fecha UTC para evitar problemas de zona horaria
    const hoyUTC = new Date(Date.UTC(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate(),
      0, 0, 0, 0
    ))
    let nuevaFecha = new Date(hoyUTC)

    if (turno === 'noche') {
      // Turno noche: la producción es para el día siguiente
      // Siempre suma 1 día excepto en madrugada (0-3AM) que ya es el día siguiente
      if (hora >= 4) {
        // Entre 4AM y 11:59PM: la noche produce para mañana
        nuevaFecha.setUTCDate(nuevaFecha.getUTCDate() + 1)
      }
      // Si hora < 4 (madrugada), ya estamos en el día de la producción nocturna
    }
    // Turno mañana: fecha es hoy (nuevaFecha ya está en hoy)

    console.log('Actualizando turno:', {
      id,
      turnoAnterior,
      turnoNuevo: turno,
      fechaAnterior: produccionExistente.fecha,
      nuevaFecha,
      horaActual: hora
    })

    // Verificar si ya existe una producción con la misma fecha/producto/turno
    const existeConflicto = await prisma.produccionDiaria.findFirst({
      where: {
        fecha: nuevaFecha,
        productoId: produccionExistente.productoId,
        turno,
        id: { not: id } // Excluir la producción actual
      }
    })

    if (existeConflicto) {
      return {
        success: false,
        error: `Ya existe una producción de ${produccionExistente.producto.nombre} para el turno ${turno === 'manana' ? 'mañana' : 'noche'} del ${nuevaFecha.toLocaleDateString()}`
      }
    }

    const produccion = await prisma.produccionDiaria.update({
      where: { id },
      data: {
        turno,
        fecha: nuevaFecha
      },
      include: {
        producto: true,
      },
    })

    console.log('Producción actualizada:', {
      id: produccion.id,
      turno: produccion.turno,
      fecha: produccion.fecha,
      producto: produccion.producto.nombre
    })

    // Registrar auditoría (no bloquear si falla)
    try {
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
          fechaAnterior: produccionExistente.fecha,
          fechaNueva: nuevaFecha,
        },
      })
    } catch (auditError) {
      console.error('Error al registrar auditoría:', auditError)
      // No bloquear la operación por errores de auditoría
    }

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

// Eliminar producción (solo si no está firmada)
export async function eliminarProduccion(id: string) {
  try {
    const session = await verifySession()

    const permisoCheck = await checkPermiso(PERMISOS.PRODUCCION_EDITAR)
    if (!permisoCheck.authorized) {
      return { success: false, error: permisoCheck.error || 'No tienes permisos para eliminar producción' }
    }

    // Validar que la producción existe
    const produccionExistente = await prisma.produccionDiaria.findUnique({
      where: { id },
      include: { producto: true },
    })

    if (!produccionExistente) {
      return { success: false, error: 'Producción no encontrada' }
    }

    // Validar que no esté firmada
    if (produccionExistente.enviado || produccionExistente.firmadoPor) {
      return { success: false, error: 'No se puede eliminar una producción que ya fue firmada' }
    }

    // Eliminar la producción
    await prisma.produccionDiaria.delete({
      where: { id },
    })

    // Registrar auditoría
    await registrarAuditoria({
      usuarioId: parseInt(session.user.id),
      accion: 'DELETE_PRODUCCION',
      entidad: 'ProduccionDiaria',
      entidadId: id,
      detalles: {
        productoId: produccionExistente.productoId,
        productoNombre: produccionExistente.producto.nombre,
        turno: produccionExistente.turno,
        totalUnidades: produccionExistente.totalUnidades,
      },
    })

    revalidatePath('/dashboard/produccion')
    return { success: true }
  } catch (error) {
    console.error('Error al eliminar producción:', error)
    return { success: false, error: 'Error al eliminar producción' }
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
