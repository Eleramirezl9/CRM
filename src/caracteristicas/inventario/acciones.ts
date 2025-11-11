'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { verifySession } from '@/compartido/lib/dal'
import { requirePermiso, PERMISOS } from '@/compartido/lib/permisos'

// Obtener inventario global consolidado
export async function obtenerInventarioGlobal() {
  // ✅ Verificación de seguridad
  await verifySession()
  await requirePermiso(PERMISOS.INVENTARIO_VER)

  try {
    const inventarios = await prisma.inventario.findMany({
      include: {
        producto: true,
        sucursal: true,
      },
      orderBy: [
        { sucursal: { nombre: 'asc' } },
        { producto: { nombre: 'asc' } },
      ],
    })
    
    // Agrupar por producto para vista consolidada
    const consolidado = inventarios.reduce((acc, inv) => {
      const key = inv.productoId
      if (!acc[key]) {
        acc[key] = {
          producto: inv.producto,
          stockTotal: 0,
          stockMinimoTotal: 0,
          sucursales: [],
          alertaCritica: false,
        }
      }
      
      acc[key].stockTotal += inv.cantidadActual
      acc[key].stockMinimoTotal += inv.stockMinimo
      acc[key].sucursales.push({
        sucursal: inv.sucursal.nombre,
        cantidad: inv.cantidadActual,
        minimo: inv.stockMinimo,
        critico: inv.cantidadActual < inv.stockMinimo,
      })
      
      if (inv.cantidadActual < inv.stockMinimo) {
        acc[key].alertaCritica = true
      }
      
      return acc
    }, {} as any)
    
    return { success: true, inventarios, consolidado: Object.values(consolidado) }
  } catch (error) {
    console.error('Error al obtener inventario:', error)
    return { success: false, error: 'Error al obtener inventario', inventarios: [], consolidado: [] }
  }
}

// Obtener inventario por sucursal
export async function obtenerInventarioPorSucursal(sucursalId: string) {
  // ✅ Verificación de seguridad
  await verifySession()
  await requirePermiso(PERMISOS.INVENTARIO_VER)

  try {
    const inventarios = await prisma.inventario.findMany({
      where: { sucursalId },
      include: {
        producto: true,
      },
      orderBy: {
        producto: { nombre: 'asc' },
      },
    })
    
    return { success: true, inventarios }
  } catch (error) {
    console.error('Error al obtener inventario:', error)
    return { success: false, error: 'Error al obtener inventario', inventarios: [] }
  }
}

// Registrar movimiento de inventario (entrada o salida)
export async function registrarMovimiento(data: {
  inventarioId: number
  tipo: 'entrada' | 'salida'
  cantidad: number
  motivo?: string
  creadorId?: number
}) {
  // ✅ Verificación de seguridad
  await verifySession()
  await requirePermiso(PERMISOS.INVENTARIO_EDITAR)

  try {
    // Obtener inventario actual
    const inventario = await prisma.inventario.findUnique({
      where: { id: data.inventarioId },
      include: { producto: true, sucursal: true },
    })
    
    if (!inventario) {
      return { success: false, error: 'Inventario no encontrado' }
    }
    
    const stockAnterior = inventario.cantidadActual
    const cantidadCambio = data.tipo === 'entrada' ? data.cantidad : -data.cantidad
    const stockNuevo = stockAnterior + cantidadCambio
    
    // Validar que no quede negativo
    if (stockNuevo < 0) {
      return { success: false, error: 'Stock insuficiente para realizar la salida' }
    }
    
    // Actualizar inventario y registrar movimiento en transacción
    const resultado = await prisma.$transaction(async (tx) => {
      // Actualizar cantidad
      const invActualizado = await tx.inventario.update({
        where: { id: data.inventarioId },
        data: { cantidadActual: stockNuevo },
      })
      
      // Registrar movimiento
      const movimiento = await tx.movimientoInventario.create({
        data: {
          inventarioId: data.inventarioId,
          productoId: inventario.productoId,
          tipo: data.tipo,
          cantidad: data.cantidad,
          motivo: data.motivo,
          creadorId: data.creadorId,
        },
      })
      
      return { inventario: invActualizado, movimiento }
    })
    
    revalidatePath('/dashboard/inventario')
    
    return {
      success: true,
      stockAnterior,
      stockNuevo,
      producto: inventario.producto.nombre,
      sucursal: inventario.sucursal.nombre,
    }
  } catch (error) {
    console.error('Error al registrar movimiento:', error)
    return { success: false, error: 'Error al registrar movimiento' }
  }
}

// Obtener movimientos recientes
export async function obtenerMovimientosRecientes(limit = 50) {
  // ✅ Verificación de seguridad
  await verifySession()
  await requirePermiso(PERMISOS.INVENTARIO_VER)

  try {
    const movimientos = await prisma.movimientoInventario.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        producto: true,
        inventario: {
          include: {
            sucursal: true,
          },
        },
        creador: {
          select: {
            nombre: true,
          },
        },
      },
    })
    
    return { success: true, movimientos }
  } catch (error) {
    console.error('Error al obtener movimientos:', error)
    return { success: false, error: 'Error al obtener movimientos', movimientos: [] }
  }
}

// Obtener alertas de stock crítico
export async function obtenerAlertasStockCritico() {
  // ✅ Verificación de seguridad
  await verifySession()
  await requirePermiso(PERMISOS.INVENTARIO_VER)

  try {
    const inventarios = await prisma.$queryRaw<any[]>`
      SELECT 
        i.id,
        i.cantidad_actual,
        i.stock_minimo,
        p.nombre as producto_nombre,
        p.sku,
        s.nombre as sucursal_nombre
      FROM inventarios i
      INNER JOIN productos p ON i.producto_id = p.id
      INNER JOIN sucursales s ON i.sucursal_id = s.id
      WHERE i.cantidad_actual < i.stock_minimo
      ORDER BY (i.cantidad_actual - i.stock_minimo) ASC
    `
    
    return { success: true, alertas: inventarios }
  } catch (error) {
    console.error('Error al obtener alertas:', error)
    return { success: false, error: 'Error al obtener alertas', alertas: [] }
  }
}

// Inicializar inventario para un producto en una sucursal
export async function inicializarInventario(data: {
  productoId: string
  sucursalId: string
  cantidadInicial: number
  stockMinimo: number
}) {
  // ✅ Verificación de seguridad
  await verifySession()
  await requirePermiso(PERMISOS.INVENTARIO_EDITAR)

  try {
    const inventario = await prisma.inventario.upsert({
      where: {
        sucursalId_productoId: {
          sucursalId: data.sucursalId,
          productoId: data.productoId,
        },
      },
      update: {
        cantidadActual: data.cantidadInicial,
        stockMinimo: data.stockMinimo,
      },
      create: {
        sucursalId: data.sucursalId,
        productoId: data.productoId,
        cantidadActual: data.cantidadInicial,
        stockMinimo: data.stockMinimo,
      },
    })
    
    revalidatePath('/dashboard/inventario')
    return { success: true, inventario }
  } catch (error) {
    console.error('Error al inicializar inventario:', error)
    return { success: false, error: 'Error al inicializar inventario' }
  }
}

// Obtener sucursales disponibles
export async function obtenerSucursales() {
  // ✅ Verificación de seguridad
  await verifySession()
  await requirePermiso(PERMISOS.INVENTARIO_VER)

  try {
    const sucursales = await prisma.sucursal.findMany({
      orderBy: { nombre: 'asc' },
    })
    
    return { success: true, sucursales }
  } catch (error) {
    console.error('Error al obtener sucursales:', error)
    return { success: false, error: 'Error al obtener sucursales', sucursales: [] }
  }
}
