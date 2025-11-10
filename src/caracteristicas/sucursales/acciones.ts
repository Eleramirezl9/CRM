'use server'

import { prisma } from '@/lib/prisma'
import { getServerSession } from '@/caracteristicas/autenticacion/server'
import { authOptions } from '@/caracteristicas/autenticacion/server'
import { z } from 'zod'
import { requireRole } from '@/compartido/lib/dal'
import { requirePermiso, PERMISOS } from '@/compartido/lib/permisos'

// ============= GESTIÓN DE SUCURSALES =============

// Esquema de validación para crear/editar sucursal
const SucursalSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  direccion: z.string().optional(),
  codigoUnico: z.string().min(1, 'El código único es requerido'),
  gerenteId: z.number().optional(),
  metaVentas: z.number().min(0, 'La meta de ventas debe ser mayor o igual a 0'),
})

export async function obtenerSucursales() {
  try {
    // ✅ CRÍTICO: Validar permisos
    await requireRole(['administrador', 'bodega'])
    await requirePermiso(PERMISOS.SUCURSALES_VER)

    const sucursales = await prisma.sucursal.findMany({
      include: {
        gerente: true,
        empresa: true,
        _count: {
          select: {
            ventas: true,
            inventarios: true,
          },
        },
      },
      orderBy: { nombre: 'asc' },
    })

    // Calcular métricas de cada sucursal
    const sucursalesConMetricas = await Promise.all(
      sucursales.map(async (sucursal) => {
        // Ventas del mes actual
        const inicioMes = new Date()
        inicioMes.setDate(1)
        inicioMes.setHours(0, 0, 0, 0)

        const ventasMes = await prisma.venta.aggregate({
          where: {
            sucursalId: sucursal.id,
            createdAt: { gte: inicioMes },
          },
          _sum: { totalVenta: true },
        })

        const totalVentas = parseFloat(ventasMes._sum.totalVenta?.toString() || '0')
        const metaVentas = parseFloat(sucursal.metaVentas.toString())
        const cumplimiento = metaVentas > 0 ? (totalVentas / metaVentas) * 100 : 0

        return {
          ...sucursal,
          totalVentasMes: totalVentas,
          cumplimientoMeta: cumplimiento,
        }
      })
    )

    return { success: true, sucursales: sucursalesConMetricas }
  } catch (error) {
    console.error('Error al obtener sucursales:', error)
    return { success: false, error: 'Error al obtener sucursales', sucursales: [] }
  }
}

export async function obtenerSucursalPorId(id: string) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: 'No autorizado' }
    }

    const sucursal = await prisma.sucursal.findUnique({
      where: { id },
      include: {
        gerente: true,
        empresa: true,
        inventarios: {
          include: {
            producto: true,
          },
        },
      },
    })

    if (!sucursal) {
      return { success: false, error: 'Sucursal no encontrada' }
    }

    return { success: true, sucursal }
  } catch (error) {
    console.error('Error al obtener sucursal:', error)
    return { success: false, error: 'Error al obtener sucursal' }
  }
}

export async function crearSucursal(data: z.infer<typeof SucursalSchema>) {
  try {
    const session = await getServerSession()
    if (!session || session.user.rol !== 'administrador') {
      return { success: false, error: 'No autorizado' }
    }

    // Validar datos
    const validatedData = SucursalSchema.parse(data)

    // Verificar que el código único no exista
    const codigoExiste = await prisma.sucursal.findUnique({
      where: { codigoUnico: validatedData.codigoUnico },
    })

    if (codigoExiste) {
      return { success: false, error: 'El código único ya existe' }
    }

    // Obtener la empresa (asumimos que hay una empresa principal)
    const empresa = await prisma.empresa.findFirst()
    if (!empresa) {
      return { success: false, error: 'No hay empresa configurada' }
    }

    // Crear sucursal
    const sucursal = await prisma.sucursal.create({
      data: {
        ...validatedData,
        empresaId: empresa.id,
      },
      include: {
        gerente: true,
        empresa: true,
      },
    })

    return { success: true, sucursal }
  } catch (error) {
    console.error('Error al crear sucursal:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Error al crear sucursal' }
  }
}

export async function actualizarSucursal(id: string, data: z.infer<typeof SucursalSchema>) {
  try {
    const session = await getServerSession()
    if (!session || session.user.rol !== 'administrador') {
      return { success: false, error: 'No autorizado' }
    }

    // Validar datos
    const validatedData = SucursalSchema.parse(data)

    // Verificar que el código único no exista en otra sucursal
    const codigoExiste = await prisma.sucursal.findFirst({
      where: {
        codigoUnico: validatedData.codigoUnico,
        id: { not: id },
      },
    })

    if (codigoExiste) {
      return { success: false, error: 'El código único ya existe' }
    }

    // Actualizar sucursal
    const sucursal = await prisma.sucursal.update({
      where: { id },
      data: validatedData,
      include: {
        gerente: true,
        empresa: true,
      },
    })

    return { success: true, sucursal }
  } catch (error) {
    console.error('Error al actualizar sucursal:', error)
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message }
    }
    return { success: false, error: 'Error al actualizar sucursal' }
  }
}

export async function obtenerGerentes() {
  try {
    const usuarios = await prisma.usuario.findMany({
      where: {
        rol: { nombre: 'sucursal' },
        sucursalGerente: null, // Solo usuarios sin sucursal asignada
      },
      include: {
        rol: true,
      },
    })

    return { success: true, gerentes: usuarios }
  } catch (error) {
    console.error('Error al obtener gerentes:', error)
    return { success: false, error: 'Error al obtener gerentes', gerentes: [] }
  }
}

// ============= CONTROL OPERATIVO DIARIO =============

export async function obtenerOperacionDia(sucursalId: string, fecha: Date) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: 'No autorizado' }
    }

    // Verificar acceso a la sucursal
    if (session.user.rol === 'sucursal' && session.user.sucursalId !== sucursalId) {
      return { success: false, error: 'No tienes acceso a esta sucursal' }
    }

    // Normalizar fecha (solo año-mes-día)
    const fechaNormalizada = new Date(fecha)
    fechaNormalizada.setHours(0, 0, 0, 0)

    // Buscar operación existente o crear nueva
    let operacion = await prisma.operacionDiaria.findUnique({
      where: {
        sucursalId_fecha: {
          sucursalId,
          fecha: fechaNormalizada,
        },
      },
      include: {
        devoluciones: {
          include: {
            producto: true,
          },
        },
      },
    })

    // Si no existe, crear operación del día
    if (!operacion) {
      // Calcular inventario inicial del día
      const inventarioInicial = await calcularInventarioInicial(sucursalId, fechaNormalizada)
      
      operacion = await prisma.operacionDiaria.create({
        data: {
          sucursalId,
          fecha: fechaNormalizada,
          totalAVender: inventarioInicial.total,
        },
        include: {
          devoluciones: {
            include: {
              producto: true,
            },
          },
        },
      })
    }

    // Recalcular totales
    await recalcularTotalesOperacion(operacion.id)

    // Obtener operación actualizada
    const operacionActualizada = await prisma.operacionDiaria.findUnique({
      where: { id: operacion.id },
      include: {
        devoluciones: {
          include: {
            producto: true,
          },
        },
        sucursal: true,
      },
    })

    return { success: true, operacion: operacionActualizada }
  } catch (error) {
    console.error('Error al obtener operación del día:', error)
    return { success: false, error: 'Error al obtener operación del día' }
  }
}

export async function confirmarRecepcionEnvio(envioId: string, ajustes: Array<{ productoId: string; cantidadRecibida: number }>) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: 'No autorizado' }
    }

    // Obtener envío
    const envio = await prisma.envio.findUnique({
      where: { id: envioId },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
        sucursalDestino: true,
      },
    })

    if (!envio) {
      return { success: false, error: 'Envío no encontrado' }
    }

    // Verificar que el usuario tenga acceso a la sucursal destino
    if (session.user.rol === 'sucursal' && session.user.sucursalId !== envio.sucursalDestinoId) {
      return { success: false, error: 'No tienes acceso a confirmar este envío' }
    }

    // Actualizar inventarios y operación del día
    const fechaHoy = new Date()
    fechaHoy.setHours(0, 0, 0, 0)

    await prisma.$transaction(async (tx) => {
      // Actualizar envío
      await tx.envio.update({
        where: { id: envioId },
        data: {
          estado: 'entregado',
          fechaEntrega: new Date(),
          confirmadoPor: parseInt(session.user.id),
          fechaConfirmacion: new Date(),
        },
      })

      // Actualizar inventarios
      for (const ajuste of ajustes) {
        const item = envio.items.find(i => i.productoId === ajuste.productoId)
        if (!item) continue

        const cantidadRecibida = ajuste.cantidadRecibida
        const cantidadEnviada = item.cantidadSolicitada

        // Actualizar inventario
        await tx.inventario.upsert({
          where: {
            sucursalId_productoId: {
              sucursalId: envio.sucursalDestinoId,
              productoId: ajuste.productoId,
            },
          },
          update: {
            cantidadActual: {
              increment: cantidadRecibida,
            },
          },
          create: {
            sucursalId: envio.sucursalDestinoId,
            productoId: ajuste.productoId,
            cantidadActual: cantidadRecibida,
            stockMinimo: 10, // Valor por defecto
          },
        })

        // Registrar movimiento
        await tx.movimientoInventario.create({
          data: {
            inventarioId: 0, // Se calculará en la query
            tipo: 'entrada',
            cantidad: cantidadRecibida,
            motivo: `Recepción de envío #${envioId}`,
            productoId: ajuste.productoId,
            creadorId: parseInt(session.user.id),
          },
        })

        // Actualizar item del envío
        await tx.envioItem.update({
          where: {
            envioId_productoId: {
              envioId,
              productoId: ajuste.productoId,
            },
          },
          data: {
            cantidadRecibida,
          },
        })
      }

      // Actualizar operación del día
      await actualizarOperacionDia(tx, envio.sucursalDestinoId, fechaHoy, ajustes)
    })

    return { success: true, message: 'Recepción confirmada exitosamente' }
  } catch (error) {
    console.error('Error al confirmar recepción:', error)
    return { success: false, error: 'Error al confirmar recepción' }
  }
}

export async function registrarDevolucion(
  operacionId: string,
  productoId: string,
  cantidad: number,
  motivo: string
) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: 'No autorizado' }
    }

    // Obtener operación
    const operacion = await prisma.operacionDiaria.findUnique({
      where: { id: operacionId },
      include: { sucursal: true },
    })

    if (!operacion) {
      return { success: false, error: 'Operación no encontrada' }
    }

    // Verificar acceso
    if (session.user.rol === 'sucursal' && session.user.sucursalId !== operacion.sucursalId) {
      return { success: false, error: 'No tienes acceso a esta operación' }
    }

    // Obtener producto
    const producto = await prisma.producto.findUnique({
      where: { id: productoId },
    })

    if (!producto) {
      return { success: false, error: 'Producto no encontrado' }
    }

    await prisma.$transaction(async (tx) => {
      // Crear devolución
      const devolucion = await tx.devolucion.create({
        data: {
          operacionId,
          productoId,
          cantidad,
          motivo,
          costoUnitario: producto.costoUnitario,
          costoTotal: producto.costoUnitario.mul(cantidad),
        },
      })

      // Actualizar inventario (reducir stock)
      await tx.inventario.updateMany({
        where: {
          sucursalId: operacion.sucursalId,
          productoId,
        },
        data: {
          cantidadActual: {
            decrement: cantidad,
          },
        },
      })

      // Recalcular totales de la operación
      await recalcularTotalesOperacion(operacionId)
    })

    return { success: true, message: 'Devolución registrada exitosamente' }
  } catch (error) {
    console.error('Error al registrar devolución:', error)
    return { success: false, error: 'Error al registrar devolución' }
  }
}

export async function cerrarOperacionDia(operacionId: string) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: 'No autorizado' }
    }

    const operacion = await prisma.operacionDiaria.findUnique({
      where: { id: operacionId },
      include: { sucursal: true },
    })

    if (!operacion) {
      return { success: false, error: 'Operación no encontrada' }
    }

    // Verificar acceso
    if (session.user.rol === 'sucursal' && session.user.sucursalId !== operacion.sucursalId) {
      return { success: false, error: 'No tienes acceso a esta operación' }
    }

    // Cerrar operación
    await prisma.operacionDiaria.update({
      where: { id: operacionId },
      data: { cerrado: true },
    })

    return { success: true, message: 'Operación del día cerrada exitosamente' }
  } catch (error) {
    console.error('Error al cerrar operación:', error)
    return { success: false, error: 'Error al cerrar operación' }
  }
}

export async function obtenerHistorialOperaciones(sucursalId: string, dias: number = 7) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: 'No autorizado' }
    }

    // Verificar acceso
    if (session.user.rol === 'sucursal' && session.user.sucursalId !== sucursalId) {
      return { success: false, error: 'No tienes acceso a esta sucursal' }
    }

    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - dias)
    fechaInicio.setHours(0, 0, 0, 0)

    const operaciones = await prisma.operacionDiaria.findMany({
      where: {
        sucursalId,
        fecha: { gte: fechaInicio },
      },
      include: {
        devoluciones: {
          include: {
            producto: true,
          },
        },
      },
      orderBy: { fecha: 'desc' },
    })

    return { success: true, operaciones }
  } catch (error) {
    console.error('Error al obtener historial:', error)
    return { success: false, error: 'Error al obtener historial', operaciones: [] }
  }
}

// ============= REPORTES =============

export async function obtenerEnviosPendientesConfirmacion(sucursalId: string) {
  try {
    const session = await getServerSession()
    if (!session) {
      return { success: false, error: 'No autorizado' }
    }

    // Verificar acceso
    if (session.user.rol === 'sucursal' && session.user.sucursalId !== sucursalId) {
      return { success: false, error: 'No tienes acceso a esta sucursal' }
    }

    const envios = await prisma.envio.findMany({
      where: {
        sucursalDestinoId: sucursalId,
        estado: 'en_transito',
      },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
        sucursalOrigen: true,
        creador: true,
      },
      orderBy: { createdAt: 'desc' },
    })

    return { success: true, envios }
  } catch (error) {
    console.error('Error al obtener envíos pendientes:', error)
    return { success: false, error: 'Error al obtener envíos pendientes', envios: [] }
  }
}

// ============= FUNCIONES AUXILIARES =============

async function calcularInventarioInicial(sucursalId: string, fecha: Date) {
  // Obtener inventario actual
  const inventarios = await prisma.inventario.findMany({
    where: { sucursalId },
    include: { producto: true },
  })

  let total = 0
  const productos = []

  for (const inv of inventarios) {
    const valor = parseFloat(inv.producto.precioVenta.toString()) * inv.cantidadActual
    total += valor
    productos.push({
      productoId: inv.productoId,
      cantidad: inv.cantidadActual,
      valor,
    })
  }

  // Obtener productos recibidos hoy
  const enviosRecibidos = await prisma.envio.findMany({
    where: {
      sucursalDestinoId: sucursalId,
      estado: 'entregado',
      fechaConfirmacion: {
        gte: fecha,
        lt: new Date(fecha.getTime() + 24 * 60 * 60 * 1000),
      },
    },
    include: {
      items: {
        include: { producto: true },
      },
    },
  })

  for (const envio of enviosRecibidos) {
    for (const item of envio.items) {
      const cantidadRecibida = item.cantidadRecibida || item.cantidadSolicitada
      const valor = parseFloat(item.producto.precioVenta.toString()) * cantidadRecibida
      total += valor
    }
  }

  return { total, productos }
}

async function actualizarOperacionDia(tx: any, sucursalId: string, fecha: Date, ajustes: Array<{ productoId: string; cantidadRecibida: number }>) {
  // Obtener o crear operación del día
  let operacion = await tx.operacionDiaria.findUnique({
    where: {
      sucursalId_fecha: {
        sucursalId,
        fecha,
      },
    },
  })

  if (!operacion) {
    operacion = await tx.operacionDiaria.create({
      data: {
        sucursalId,
        fecha,
        totalAVender: 0,
      },
    })
  }

  // Calcular valor de productos recibidos
  let valorRecibido = 0
  for (const ajuste of ajustes) {
    const producto = await tx.producto.findUnique({
      where: { id: ajuste.productoId },
    })
    if (producto) {
      valorRecibido += parseFloat(producto.precioVenta.toString()) * ajuste.cantidadRecibida
    }
  }

  // Actualizar total a vender
  await tx.operacionDiaria.update({
    where: { id: operacion.id },
    data: {
      totalAVender: {
        increment: valorRecibido,
      },
    },
  })
}

async function recalcularTotalesOperacion(operacionId: string) {
  const operacion = await prisma.operacionDiaria.findUnique({
    where: { id: operacionId },
    include: {
      devoluciones: true,
      sucursal: {
        include: {
          ventas: {
            where: {
              createdAt: {
                gte: new Date(),
                lt: new Date(),
              },
            },
            include: {
              items: {
                include: {
                  producto: true,
                },
              },
            },
          },
        },
      },
    },
  })

  if (!operacion) return

  // Obtener fecha de la operación
  const fechaOperacion = operacion.fecha
  const fechaFin = new Date(fechaOperacion.getTime() + 24 * 60 * 60 * 1000)

  // Obtener ventas del día
  const ventasDelDia = await prisma.venta.findMany({
    where: {
      sucursalId: operacion.sucursalId,
      createdAt: {
        gte: fechaOperacion,
        lt: fechaFin,
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

  // Calcular total vendido
  let totalVendido = 0
  let totalCosto = 0

  for (const venta of ventasDelDia) {
    totalVendido += parseFloat(venta.totalVenta.toString())
    for (const item of venta.items) {
      totalCosto += parseFloat(item.producto.costoUnitario.toString()) * item.cantidad
    }
  }

  // Calcular total pérdidas
  const totalPerdidas = operacion.devoluciones.reduce(
    (sum: number, dev: any) => sum + parseFloat(dev.costoTotal.toString()),
    0
  )

  // Actualizar operación
  await prisma.operacionDiaria.update({
    where: { id: operacionId },
    data: {
      totalVendido,
      totalCosto,
      totalPerdidas,
      efectivoReal: totalVendido,
    },
  })
}
