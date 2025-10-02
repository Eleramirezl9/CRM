'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { Decimal } from '@prisma/client/runtime/library'

// Registrar venta
export async function registrarVenta(data: {
  sucursalId: string
  vendedorId?: number
  items: Array<{
    productoId: string
    cantidad: number
    precioUnitario: number
  }>
  metodoPago?: string
}) {
  try {
    if (data.items.length === 0) {
      return { success: false, error: 'Debe agregar al menos un producto' }
    }
    
    // Calcular total
    const totalVenta = data.items.reduce((sum, item) => sum + (item.cantidad * item.precioUnitario), 0)
    
    // Verificar stock disponible
    for (const item of data.items) {
      const inventario = await prisma.inventario.findUnique({
        where: {
          sucursalId_productoId: {
            sucursalId: data.sucursalId,
            productoId: item.productoId,
          },
        },
        include: { producto: true },
      })
      
      if (!inventario || inventario.cantidadActual < item.cantidad) {
        return {
          success: false,
          error: `Stock insuficiente de ${inventario?.producto.nombre}. Disponible: ${inventario?.cantidadActual || 0}`,
        }
      }
    }
    
    // Crear venta y actualizar inventario en transacción
    const venta = await prisma.$transaction(async (tx) => {
      // Crear venta
      const nuevaVenta = await tx.venta.create({
        data: {
          sucursalId: data.sucursalId,
          vendedorId: data.vendedorId,
          totalVenta: new Decimal(totalVenta),
          metodoPago: data.metodoPago,
          items: {
            create: data.items.map(item => ({
              productoId: item.productoId,
              cantidad: item.cantidad,
              precioUnitario: new Decimal(item.precioUnitario),
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
      
      // Actualizar inventario y registrar movimientos
      for (const item of data.items) {
        const inventario = await tx.inventario.update({
          where: {
            sucursalId_productoId: {
              sucursalId: data.sucursalId,
              productoId: item.productoId,
            },
          },
          data: {
            cantidadActual: {
              decrement: item.cantidad,
            },
          },
        })
        
        // Registrar movimiento
        await tx.movimientoInventario.create({
          data: {
            inventarioId: inventario.id,
            productoId: item.productoId,
            tipo: 'salida',
            cantidad: item.cantidad,
            motivo: `Venta #${nuevaVenta.id.slice(0, 8)}`,
            creadorId: data.vendedorId,
          },
        })
      }
      
      return nuevaVenta
    })
    
    revalidatePath('/dashboard/ventas')
    revalidatePath('/dashboard/inventario')
    
    return { success: true, venta }
  } catch (error) {
    console.error('Error al registrar venta:', error)
    return { success: false, error: 'Error al registrar venta' }
  }
}

// Obtener ventas
export async function obtenerVentas(sucursalId?: string, limit = 50) {
  try {
    const ventas = await prisma.venta.findMany({
      where: sucursalId ? { sucursalId } : undefined,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sucursal: true,
        vendedor: {
          select: {
            nombre: true,
          },
        },
        items: {
          include: {
            producto: true,
          },
        },
      },
    })
    
    return { success: true, ventas }
  } catch (error) {
    console.error('Error al obtener ventas:', error)
    return { success: false, error: 'Error al obtener ventas', ventas: [] }
  }
}

// Obtener estadísticas de ventas
export async function obtenerEstadisticasVentas(sucursalId?: string) {
  try {
    const where = sucursalId ? { sucursalId } : {}
    
    // Ventas del día
    const hoy = new Date()
    hoy.setHours(0, 0, 0, 0)
    
    const ventasHoy = await prisma.venta.aggregate({
      where: {
        ...where,
        createdAt: {
          gte: hoy,
        },
      },
      _sum: {
        totalVenta: true,
      },
      _count: true,
    })
    
    // Ventas del mes
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
    
    const ventasMes = await prisma.venta.aggregate({
      where: {
        ...where,
        createdAt: {
          gte: inicioMes,
        },
      },
      _sum: {
        totalVenta: true,
      },
      _count: true,
    })
    
    // Productos más vendidos
    const productosMasVendidos = await prisma.ventaItem.groupBy({
      by: ['productoId'],
      where: sucursalId ? {
        venta: {
          sucursalId,
        },
      } : undefined,
      _sum: {
        cantidad: true,
      },
      orderBy: {
        _sum: {
          cantidad: 'desc',
        },
      },
      take: 5,
    })
    
    // Obtener detalles de productos
    const productosIds = productosMasVendidos.map(p => p.productoId)
    const productos = await prisma.producto.findMany({
      where: {
        id: {
          in: productosIds,
        },
      },
    })
    
    const topProductos = productosMasVendidos.map(pv => {
      const producto = productos.find(p => p.id === pv.productoId)
      return {
        producto: producto?.nombre || 'Desconocido',
        cantidad: pv._sum.cantidad || 0,
      }
    })
    
    return {
      success: true,
      estadisticas: {
        ventasHoy: {
          total: parseFloat(ventasHoy._sum.totalVenta?.toString() || '0'),
          cantidad: ventasHoy._count,
        },
        ventasMes: {
          total: parseFloat(ventasMes._sum.totalVenta?.toString() || '0'),
          cantidad: ventasMes._count,
        },
        topProductos,
      },
    }
  } catch (error) {
    console.error('Error al obtener estadísticas:', error)
    return {
      success: false,
      error: 'Error al obtener estadísticas',
      estadisticas: {
        ventasHoy: { total: 0, cantidad: 0 },
        ventasMes: { total: 0, cantidad: 0 },
        topProductos: [],
      },
    }
  }
}

// Obtener productos disponibles para venta en una sucursal
export async function obtenerProductosDisponibles(sucursalId: string) {
  try {
    const inventarios = await prisma.inventario.findMany({
      where: {
        sucursalId,
        cantidadActual: {
          gt: 0,
        },
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
    
    return { success: true, productos: inventarios }
  } catch (error) {
    console.error('Error al obtener productos:', error)
    return { success: false, error: 'Error al obtener productos', productos: [] }
  }
}
