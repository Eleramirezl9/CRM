'use server'

import { prisma } from '@/lib/prisma'
import { verifySession } from '@/compartido/lib/dal'
import { checkPermiso, PERMISOS } from '@/compartido/lib/permisos'

export async function obtenerKpisDashboard() {
  try {
    // ✅ CRÍTICO: Validar sesión y permisos
    await verifySession()

    const permisoCheck = await checkPermiso(PERMISOS.REPORTES_VER)
    if (!permisoCheck.authorized) {
      return {
        success: false,
        error: permisoCheck.error || 'No tienes permisos para ver KPIs globales',
        kpis: { ventasTotales: 0, rentabilidad: 0, stockCritico: 0, enviosPendientes: 0 }
      }
    }

    // Ventas totales del mes
    const inicioMes = new Date()
    inicioMes.setDate(1)
    inicioMes.setHours(0, 0, 0, 0)
    
    const ventasMes = await prisma.venta.aggregate({
      where: {
        createdAt: {
          gte: inicioMes,
        },
      },
      _sum: {
        totalVenta: true,
      },
    })
    
    // Calcular rentabilidad (ventas vs costos)
    const ventasConItems = await prisma.venta.findMany({
      where: {
        createdAt: {
          gte: inicioMes,
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
    
    let costoTotal = 0
    let ventaTotal = 0
    
    ventasConItems.forEach(venta => {
      venta.items.forEach(item => {
        const costo = parseFloat(item.producto.costoUnitario.toString()) * item.cantidad
        const venta = parseFloat(item.precioUnitario.toString()) * item.cantidad
        costoTotal += costo
        ventaTotal += venta
      })
    })
    
    const rentabilidad = ventaTotal > 0 ? ((ventaTotal - costoTotal) / ventaTotal) : 0
    
    // Stock crítico
    const stockCritico = await prisma.$queryRaw<any[]>`
      SELECT COUNT(*) as count
      FROM inventarios
      WHERE cantidad_actual < stock_minimo
    `
    
    // Envíos pendientes
    const enviosPendientes = await prisma.envio.count({
      where: {
        estado: {
          in: ['pendiente', 'en_preparacion', 'en_transito'],
        },
      },
    })
    
    return {
      success: true,
      kpis: {
        ventasTotales: parseFloat(ventasMes._sum.totalVenta?.toString() || '0'),
        rentabilidad,
        stockCritico: parseInt(stockCritico[0]?.count || '0'),
        enviosPendientes,
      },
    }
  } catch (error) {
    console.error('Error al obtener KPIs:', error)
    return {
      success: false,
      kpis: {
        ventasTotales: 0,
        rentabilidad: 0,
        stockCritico: 0,
        enviosPendientes: 0,
      },
    }
  }
}

export async function obtenerAlertasDashboard() {
  try {
    // ✅ CRÍTICO: Validar sesión y permisos
    await verifySession()

    const permisoCheck = await checkPermiso(PERMISOS.REPORTES_VER)
    if (!permisoCheck.authorized) {
      return { success: false, error: permisoCheck.error || 'No tienes permisos para ver alertas globales', alertas: [] }
    }

    const alertas: any[] = []

    // Productos con stock crítico
    const stockCritico = await prisma.inventario.findMany({
      where: {
        cantidadActual: {
          lt: prisma.inventario.fields.stockMinimo,
        },
      },
      include: {
        producto: true,
        sucursal: true,
      },
      take: 5,
    })
    
    stockCritico.forEach(inv => {
      alertas.push({
        tipo: 'stock_critico',
        prioridad: inv.cantidadActual === 0 ? 'alta' : 'media',
        mensaje: `${inv.producto.nombre} en ${inv.sucursal.nombre}: ${inv.cantidadActual}/${inv.stockMinimo}`,
      })
    })
    
    // Envíos pendientes por más de 3 días
    const tresDiasAtras = new Date()
    tresDiasAtras.setDate(tresDiasAtras.getDate() - 3)
    
    const enviosAtrasados = await prisma.envio.findMany({
      where: {
        estado: 'pendiente',
        createdAt: {
          lt: tresDiasAtras,
        },
      },
      include: {
        sucursalOrigen: true,
        sucursalDestino: true,
      },
      take: 3,
    })
    
    enviosAtrasados.forEach(envio => {
      alertas.push({
        tipo: 'envio_atrasado',
        prioridad: 'alta',
        mensaje: `Envío pendiente: ${envio.sucursalOrigen.nombre} → ${envio.sucursalDestino.nombre}`,
      })
    })
    
    return { success: true, alertas }
  } catch (error) {
    console.error('Error al obtener alertas:', error)
    return { success: false, alertas: [] }
  }
}

export async function obtenerResumenSucursales() {
  try {
    // ✅ CRÍTICO: Validar sesión y permisos
    await verifySession()

    const permisoCheck = await checkPermiso(PERMISOS.REPORTES_VER)
    if (!permisoCheck.authorized) {
      return { success: false, error: permisoCheck.error || 'No tienes permisos para ver resumen de sucursales', sucursales: [] }
    }

    const sucursales = await prisma.sucursal.findMany({
      include: {
        ventas: {
          where: {
            createdAt: {
              gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            },
          },
        },
        inventarios: true,
      },
    })
    
    const resumen = sucursales.map(suc => {
      const ventasMes = suc.ventas.reduce((sum, v) => sum + parseFloat(v.totalVenta.toString()), 0)
      const stockTotal = suc.inventarios.reduce((sum, inv) => sum + inv.cantidadActual, 0)
      const productosActivos = suc.inventarios.filter(inv => inv.cantidadActual > 0).length
      
      const metaVentasNum = parseFloat(suc.metaVentas.toString())
      return {
        nombre: suc.nombre,
        ventasMes,
        metaVentas: metaVentasNum,
        cumplimiento: metaVentasNum > 0 ? (ventasMes / metaVentasNum) * 100 : 0,
        stockTotal,
        productosActivos,
      }
    })
    
    return { success: true, sucursales: resumen }
  } catch (error) {
    console.error('Error al obtener resumen:', error)
    return { success: false, sucursales: [] }
  }
}
