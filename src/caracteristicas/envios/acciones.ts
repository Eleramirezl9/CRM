'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentSession } from '@/compartido/lib/dal'
import { checkPermiso, PERMISOS } from '@/compartido/lib/permisos'

// Obtener todos los envíos
export async function obtenerEnvios() {
  // ✅ Verificación de seguridad
  const session = await getCurrentSession()
  if (!session) {
    return { success: false, error: 'No autorizado', envios: [] }
  }

  const authCheck = await checkPermiso(PERMISOS.ENVIOS_VER)
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error ||'No tienes permisos para ver envíos', envios: [] }
  }

  try {
    const envios = await prisma.envio.findMany({
      include: {
        sucursalOrigen: true,
        sucursalDestino: true,
        items: {
          include: {
            producto: true,
          },
        },
        creador: {
          select: {
            nombre: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
    
    return { success: true, envios }
  } catch (error) {
    console.error('Error al obtener envíos:', error)
    return { success: false, error: 'Error al obtener envíos', envios: [] }
  }
}

// Obtener envío por ID
export async function obtenerEnvioPorId(envioId: string) {
  const session = await getCurrentSession()
  if (!session) {
    return { success: false, error: 'No autorizado', envio: null }
  }

  const authCheck = await checkPermiso(PERMISOS.ENVIOS_VER)
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error || 'No tienes permisos', envio: null }
  }

  try {
    const envio = await prisma.envio.findUnique({
      where: { id: envioId },
      include: {
        sucursalOrigen: true,
        sucursalDestino: true,
        items: {
          include: {
            producto: true,
          },
        },
        creador: {
          select: {
            nombre: true,
          },
        },
      },
    })

    if (!envio) {
      return { success: false, error: 'Envío no encontrado', envio: null }
    }

    return { success: true, envio }
  } catch (error) {
    console.error('Error al obtener envío:', error)
    return { success: false, error: 'Error al obtener envío', envio: null }
  }
}

// Actualizar envío (solo si no está entregado o en tránsito)
export async function actualizarEnvio(
  envioId: string,
  data: {
    sucursalDestinoId?: string
    items: Array<{
      productoId: string
      cantidadSolicitada: number
    }>
  }
) {
  const session = await getCurrentSession()
  if (!session) {
    return { success: false, error: 'No autorizado' }
  }

  const authCheck = await checkPermiso(PERMISOS.ENVIOS_EDITAR)
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error || 'No tienes permisos para editar envíos' }
  }

  try {
    const envio = await prisma.envio.findUnique({
      where: { id: envioId },
      include: { items: true },
    })

    if (!envio) {
      return { success: false, error: 'Envío no encontrado' }
    }

    // Solo permitir edición si está pendiente o en preparación
    if (envio.estado === 'en_transito' || envio.estado === 'entregado') {
      return { success: false, error: 'No se puede editar un envío en tránsito o entregado' }
    }

    if (data.items.length === 0) {
      return { success: false, error: 'Debe agregar al menos un producto' }
    }

    // Verificar stock disponible
    for (const item of data.items) {
      const inventario = await prisma.inventario.findUnique({
        where: {
          sucursalId_productoId: {
            sucursalId: envio.sucursalOrigenId,
            productoId: item.productoId,
          },
        },
      })

      if (!inventario || inventario.cantidadActual < item.cantidadSolicitada) {
        const producto = await prisma.producto.findUnique({ where: { id: item.productoId } })
        return {
          success: false,
          error: `Stock insuficiente de ${producto?.nombre}. Disponible: ${inventario?.cantidadActual || 0}`,
        }
      }
    }

    // Actualizar envío en transacción
    await prisma.$transaction(async (tx) => {
      // Eliminar items anteriores
      await tx.envioItem.deleteMany({
        where: { envioId },
      })

      // Crear nuevos items
      await tx.envioItem.createMany({
        data: data.items.map(item => ({
          envioId,
          productoId: item.productoId,
          cantidadSolicitada: item.cantidadSolicitada,
        })),
      })

      // Actualizar destino si cambió
      if (data.sucursalDestinoId) {
        await tx.envio.update({
          where: { id: envioId },
          data: { sucursalDestinoId: data.sucursalDestinoId },
        })
      }
    })

    revalidatePath('/dashboard/envios')
    return { success: true }
  } catch (error) {
    console.error('Error al actualizar envío:', error)
    return { success: false, error: 'Error al actualizar envío' }
  }
}

// Crear envío
export async function crearEnvio(data: {
  empresaId: string
  sucursalOrigenId: string
  sucursalDestinoId: string
  items: Array<{
    productoId: string
    cantidadSolicitada: number
  }>
  creadorId?: number
}) {
  // ✅ Verificación de seguridad
  const session = await getCurrentSession()
  if (!session) {
    return { success: false, error: 'No autorizado' }
  }

  const authCheck = await checkPermiso(PERMISOS.ENVIOS_CREAR)
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error || 'No tienes permisos para crear envíos' }
  }

  try {
    if (data.sucursalOrigenId === data.sucursalDestinoId) {
      return { success: false, error: 'La sucursal origen y destino no pueden ser la misma' }
    }
    
    if (data.items.length === 0) {
      return { success: false, error: 'Debe agregar al menos un producto' }
    }
    
    // Verificar stock disponible en origen
    for (const item of data.items) {
      const inventario = await prisma.inventario.findUnique({
        where: {
          sucursalId_productoId: {
            sucursalId: data.sucursalOrigenId,
            productoId: item.productoId,
          },
        },
      })
      
      if (!inventario || inventario.cantidadActual < item.cantidadSolicitada) {
        const producto = await prisma.producto.findUnique({ where: { id: item.productoId } })
        return {
          success: false,
          error: `Stock insuficiente de ${producto?.nombre}. Disponible: ${inventario?.cantidadActual || 0}`,
        }
      }
    }
    
    // Crear envío con items
    const envio = await prisma.envio.create({
      data: {
        empresaId: data.empresaId,
        sucursalOrigenId: data.sucursalOrigenId,
        sucursalDestinoId: data.sucursalDestinoId,
        estado: 'pendiente',
        creadorId: data.creadorId,
        items: {
          create: data.items.map(item => ({
            productoId: item.productoId,
            cantidadSolicitada: item.cantidadSolicitada,
          })),
        },
      },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
      },
    })
    
    revalidatePath('/dashboard/envios')
    return { success: true, envio }
  } catch (error) {
    console.error('Error al crear envío:', error)
    return { success: false, error: 'Error al crear envío' }
  }
}

// Actualizar estado de envío
export async function actualizarEstadoEnvio(envioId: string, nuevoEstado: string) {
  // ✅ Verificación de seguridad
  const session = await getCurrentSession()
  if (!session) {
    return { success: false, error: 'No autorizado' }
  }

  const authCheck = await checkPermiso(PERMISOS.ENVIOS_EDITAR)
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error || 'No tienes permisos para editar envíos' }
  }

  try {
    // Estados que se pueden cambiar desde bodega
    // "entregado" solo se puede cambiar desde confirmarRecepcionEnvio (sucursal)
    const estadosValidos = ['pendiente', 'en_preparacion', 'en_transito']
    if (!estadosValidos.includes(nuevoEstado)) {
      return {
        success: false,
        error: nuevoEstado === 'entregado'
          ? 'El estado "entregado" solo puede ser asignado por la sucursal al confirmar recepción'
          : 'Estado inválido'
      }
    }

    const envio = await prisma.envio.findUnique({
      where: { id: envioId },
      include: { items: true },
    })

    if (!envio) {
      return { success: false, error: 'Envío no encontrado' }
    }
    
    // Si cambia a "en_transito", descontar del inventario origen
    if (nuevoEstado === 'en_transito' && envio.estado !== 'en_transito') {
      // Pre-cargar todos los inventarios de una vez
      const inventarios = await prisma.inventario.findMany({
        where: {
          sucursalId: envio.sucursalOrigenId,
          productoId: { in: envio.items.map(i => i.productoId) },
        },
      })

      const inventarioMap = new Map(
        inventarios.map(inv => [`${inv.sucursalId}-${inv.productoId}`, inv])
      )

      await prisma.$transaction(async (tx) => {
        // Actualizar envío primero
        await tx.envio.update({
          where: { id: envioId },
          data: {
            estado: nuevoEstado,
            fechaEnvio: new Date(),
          },
        })

        // Procesar items en paralelo donde sea posible
        const promises = envio.items.map(async (item) => {
          const inventario = inventarioMap.get(`${envio.sucursalOrigenId}-${item.productoId}`)

          // Update inventario y envioItem en paralelo
          await Promise.all([
            tx.inventario.update({
              where: {
                sucursalId_productoId: {
                  sucursalId: envio.sucursalOrigenId,
                  productoId: item.productoId,
                },
              },
              data: {
                cantidadActual: { decrement: item.cantidadSolicitada },
              },
            }),
            tx.envioItem.update({
              where: {
                envioId_productoId: {
                  envioId: envio.id,
                  productoId: item.productoId,
                },
              },
              data: { cantidadEnviada: item.cantidadSolicitada },
            }),
          ])

          // Registrar movimiento
          if (inventario) {
            await tx.movimientoInventario.create({
              data: {
                inventarioId: inventario.id,
                productoId: item.productoId,
                tipo: 'salida',
                cantidad: item.cantidadSolicitada,
                motivo: `Envío #${envioId.slice(0, 8)}`,
              },
            })
          }
        })

        await Promise.all(promises)
      })
    } else {
      // Estado simple (pendiente -> en_preparacion)
      await prisma.envio.update({
        where: { id: envioId },
        data: { estado: nuevoEstado },
      })
    }
    
    revalidatePath('/dashboard/envios')
    return { success: true }
  } catch (error) {
    console.error('Error al actualizar estado:', error)
    return { success: false, error: 'Error al actualizar estado' }
  }
}

// Sugerir envíos inteligentes basados en stock crítico
export async function sugerirEnvios() {
  // ✅ Verificación de seguridad
  const session = await getCurrentSession()
  if (!session) {
    return { success: false, error: 'No autorizado', sugerencias: [] }
  }

  const authCheck = await checkPermiso(PERMISOS.ENVIOS_VER)
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error || 'No tienes permisos para ver envíos', sugerencias: [] }
  }

  try {
    // Obtener productos con stock crítico
    const inventariosCriticos = await prisma.inventario.findMany({
      where: {
        cantidadActual: {
          lt: prisma.inventario.fields.stockMinimo,
        },
      },
      include: {
        producto: true,
        sucursal: true,
      },
    })
    
    const sugerencias = []
    
    for (const invCritico of inventariosCriticos) {
      // Buscar sucursales con exceso de stock del mismo producto
      const inventariosExceso = await prisma.inventario.findMany({
        where: {
          productoId: invCritico.productoId,
          sucursalId: { not: invCritico.sucursalId },
          cantidadActual: {
            gt: prisma.inventario.fields.stockMinimo,
          },
        },
        include: {
          sucursal: true,
        },
        orderBy: {
          cantidadActual: 'desc',
        },
      })
      
      if (inventariosExceso.length > 0) {
        const origen = inventariosExceso[0]
        const cantidadSugerida = Math.min(
          invCritico.stockMinimo - invCritico.cantidadActual,
          origen.cantidadActual - origen.stockMinimo
        )
        
        if (cantidadSugerida > 0) {
          sugerencias.push({
            producto: invCritico.producto,
            sucursalOrigen: origen.sucursal,
            sucursalDestino: invCritico.sucursal,
            cantidadSugerida,
            prioridad: invCritico.cantidadActual === 0 ? 'alta' : 'media',
          })
        }
      }
    }
    
    return { success: true, sugerencias }
  } catch (error) {
    console.error('Error al generar sugerencias:', error)
    return { success: false, error: 'Error al generar sugerencias', sugerencias: [] }
  }
}
