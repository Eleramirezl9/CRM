'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/compartido/lib/dal'
import { requirePermiso, PERMISOS } from '@/compartido/lib/permisos'

// Obtener todos los envíos
export async function obtenerEnvios() {
  // ✅ Verificación de seguridad
  await verifySession()
  await requirePermiso(PERMISOS.ENVIOS_VER)

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
  await verifySession()
  await requirePermiso(PERMISOS.ENVIOS_CREAR)

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
  await verifySession()
  await requirePermiso(PERMISOS.ENVIOS_EDITAR)

  try {
    const estadosValidos = ['pendiente', 'en_preparacion', 'en_transito', 'entregado']
    if (!estadosValidos.includes(nuevoEstado)) {
      return { success: false, error: 'Estado inválido' }
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
      await prisma.$transaction(async (tx) => {
        for (const item of envio.items) {
          await tx.inventario.update({
            where: {
              sucursalId_productoId: {
                sucursalId: envio.sucursalOrigenId,
                productoId: item.productoId,
              },
            },
            data: {
              cantidadActual: {
                decrement: item.cantidadSolicitada,
              },
            },
          })
          
          // Registrar movimiento
          const inventario = await tx.inventario.findUnique({
            where: {
              sucursalId_productoId: {
                sucursalId: envio.sucursalOrigenId,
                productoId: item.productoId,
              },
            },
          })
          
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
          
          // Actualizar cantidad enviada
          await tx.envioItem.update({
            where: {
              envioId_productoId: {
                envioId: envio.id,
                productoId: item.productoId,
              },
            },
            data: {
              cantidadEnviada: item.cantidadSolicitada,
            },
          })
        }
        
        await tx.envio.update({
          where: { id: envioId },
          data: {
            estado: nuevoEstado,
            fechaEnvio: new Date(),
          },
        })
      })
    }
    // Si cambia a "entregado", agregar al inventario destino
    else if (nuevoEstado === 'entregado' && envio.estado !== 'entregado') {
      await prisma.$transaction(async (tx) => {
        for (const item of envio.items) {
          const cantidadRecibida = item.cantidadEnviada || item.cantidadSolicitada
          
          // Crear o actualizar inventario destino
          await tx.inventario.upsert({
            where: {
              sucursalId_productoId: {
                sucursalId: envio.sucursalDestinoId,
                productoId: item.productoId,
              },
            },
            update: {
              cantidadActual: {
                increment: cantidadRecibida,
              },
            },
            create: {
              sucursalId: envio.sucursalDestinoId,
              productoId: item.productoId,
              cantidadActual: cantidadRecibida,
              stockMinimo: 10, // Default
            },
          })
          
          // Registrar movimiento
          const inventario = await tx.inventario.findUnique({
            where: {
              sucursalId_productoId: {
                sucursalId: envio.sucursalDestinoId,
                productoId: item.productoId,
              },
            },
          })
          
          if (inventario) {
            await tx.movimientoInventario.create({
              data: {
                inventarioId: inventario.id,
                productoId: item.productoId,
                tipo: 'entrada',
                cantidad: cantidadRecibida,
                motivo: `Recepción envío #${envioId.slice(0, 8)}`,
              },
            })
          }
          
          // Actualizar cantidad recibida
          await tx.envioItem.update({
            where: {
              envioId_productoId: {
                envioId: envio.id,
                productoId: item.productoId,
              },
            },
            data: {
              cantidadRecibida,
            },
          })
        }
        
        await tx.envio.update({
          where: { id: envioId },
          data: {
            estado: nuevoEstado,
            fechaEntrega: new Date(),
          },
        })
      })
    } else {
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
  await verifySession()
  await requirePermiso(PERMISOS.ENVIOS_VER)
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
