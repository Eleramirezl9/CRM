'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getCurrentSession } from '@/compartido/lib/dal'
import { checkPermiso, PERMISOS } from '@/compartido/lib/permisos'

// Obtener inventario global consolidado
export async function obtenerInventarioGlobal() {
  // ✅ Verificación de seguridad
  const session = await getCurrentSession()
  if (!session) {
    return { success: false, error: 'No autorizado', inventarios: [], consolidado: [] }
  }

  const authCheck = await checkPermiso(PERMISOS.INVENTARIO_VER)
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error || 'No tienes permisos para ver inventario', inventarios: [], consolidado: [] }
  }

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
  const session = await getCurrentSession()
  if (!session) {
    return { success: false, error: 'No autorizado', inventarios: [] }
  }

  const authCheck = await checkPermiso(PERMISOS.INVENTARIO_VER)
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error || 'No tienes permisos para ver inventario', inventarios: [] }
  }

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
  productoId: string
  sucursalId: string
  tipo: 'entrada' | 'salida'
  cantidad: number
  motivo?: string
}) {
  // ✅ Verificación de seguridad
  const session = await getCurrentSession()
  if (!session) {
    return { success: false, error: 'No autorizado' }
  }

  const authCheck = await checkPermiso(PERMISOS.INVENTARIO_EDITAR)
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error || 'No tienes permisos para editar inventario' }
  }

  try {
    // Buscar o crear inventario
    let inventario = await prisma.inventario.findUnique({
      where: {
        sucursalId_productoId: {
          sucursalId: data.sucursalId,
          productoId: data.productoId,
        },
      },
      include: { producto: true, sucursal: true },
    })

    if (!inventario) {
      // Crear inventario si no existe
      inventario = await prisma.inventario.create({
        data: {
          sucursalId: data.sucursalId,
          productoId: data.productoId,
          cantidadActual: 0,
          stockMinimo: 10,
        },
        include: { producto: true, sucursal: true },
      })
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
        where: { id: inventario.id },
        data: { cantidadActual: stockNuevo },
      })

      // Registrar movimiento
      const movimiento = await tx.movimientoInventario.create({
        data: {
          inventarioId: inventario.id,
          productoId: inventario.productoId,
          tipo: data.tipo,
          cantidad: data.cantidad,
          motivo: data.motivo,
          creadorId: parseInt(session.user.id),
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

// Obtener alertas de stock crítico
export async function obtenerAlertasStockCritico() {
  // ✅ Verificación de seguridad
  const session = await getCurrentSession()
  if (!session) {
    return { success: false, error: 'No autorizado', alertas: [] }
  }

  const authCheck = await checkPermiso(PERMISOS.INVENTARIO_VER)
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error || 'No tienes permisos para ver alertas de inventario', alertas: [] }
  }

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
  const session = await getCurrentSession()
  if (!session) {
    return { success: false, error: 'No autorizado' }
  }

  const authCheck = await checkPermiso(PERMISOS.INVENTARIO_EDITAR)
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error || 'No tienes permisos para editar inventario' }
  }

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
  const session = await getCurrentSession()
  if (!session) {
    return { success: false, error: 'No autorizado', sucursales: [] }
  }

  const authCheck = await checkPermiso(PERMISOS.INVENTARIO_VER)
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error || 'No tienes permisos para ver sucursales', sucursales: [] }
  }

  try {
    const sucursales = await prisma.sucursal.findMany({
      select: {
        id: true,
        nombre: true,
      },
      orderBy: { nombre: 'asc' },
    })

    return { success: true, sucursales }
  } catch (error) {
    console.error('Error al obtener sucursales:', error)
    return { success: false, error: 'Error al obtener sucursales', sucursales: [] }
  }
}

// Obtener movimientos recientes agrupados por día
export async function obtenerMovimientosRecientes(dias: number = 7) {
  const session = await getCurrentSession()
  if (!session) {
    return { success: false, error: 'No autorizado', movimientos: [], estadisticas: null }
  }

  const authCheck = await checkPermiso(PERMISOS.INVENTARIO_VER)
  if (!authCheck.authorized) {
    return { success: false, error: authCheck.error || 'No tienes permisos', movimientos: [], estadisticas: null }
  }

  try {
    const fechaInicio = new Date()
    fechaInicio.setDate(fechaInicio.getDate() - dias)
    fechaInicio.setHours(0, 0, 0, 0)

    const movimientos = await prisma.movimientoInventario.findMany({
      where: {
        creado_at: {
          gte: fechaInicio,
        },
      },
      include: {
        producto: {
          select: {
            id: true,
            nombre: true,
            sku: true,
          },
        },
        inventario: {
          include: {
            sucursal: {
              select: {
                id: true,
                nombre: true,
              },
            },
          },
        },
        creador: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
      orderBy: {
        creado_at: 'desc',
      },
    })

    // Calcular estadísticas
    const totalEntradas = movimientos
      .filter(m => m.tipo === 'entrada')
      .reduce((sum, m) => sum + m.cantidad, 0)

    const totalSalidas = movimientos
      .filter(m => m.tipo === 'salida')
      .reduce((sum, m) => sum + m.cantidad, 0)

    const estadisticas = {
      totalMovimientos: movimientos.length,
      totalEntradas,
      totalSalidas,
      productosUnicos: new Set(movimientos.map(m => m.productoId)).size,
    }

    // Serializar fechas para evitar problemas con Client Components
    const movimientosSerializados = movimientos.map(m => ({
      id: m.id,
      tipo: m.tipo,
      cantidad: m.cantidad,
      motivo: m.motivo,
      creado_at: m.creado_at.toISOString(),
      producto: m.producto,
      sucursal: m.inventario.sucursal,
      creador: m.creador,
    }))

    return { success: true, movimientos: movimientosSerializados, estadisticas }
  } catch (error) {
    console.error('Error al obtener movimientos:', error)
    return { success: false, error: 'Error al obtener movimientos', movimientos: [], estadisticas: null }
  }
}
