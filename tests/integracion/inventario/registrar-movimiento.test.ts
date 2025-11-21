/**
 * Test de Integración: Registrar Movimiento de Inventario
 *
 * Prueba el flujo completo de registrar movimientos (entradas/salidas)
 * usando productoId y sucursalId (nueva API)
 */

import { registrarMovimiento, obtenerMovimientosRecientes } from '@/caracteristicas/inventario/acciones'
import { prisma } from '@/lib/prisma'

// Mock de sesión y permisos
jest.mock('@/compartido/lib/dal', () => ({
  getCurrentSession: jest.fn(() => Promise.resolve({
    user: { id: '1', rol: 'administrador' }
  })),
  verifySession: jest.fn(() => Promise.resolve({
    user: { id: '1', rol: 'administrador' }
  })),
}))

jest.mock('@/compartido/lib/permisos', () => ({
  checkPermiso: jest.fn(() => Promise.resolve({ authorized: true })),
  verificarPermiso: jest.fn(() => Promise.resolve(true)),
  PERMISOS: {
    INVENTARIO_VER: 'inventario:ver',
    INVENTARIO_EDITAR: 'inventario:editar',
  },
}))

describe('registrarMovimiento - Tests de Integración', () => {
  let sucursalId: string
  let productoId: string

  beforeEach(async () => {
    // Limpiar
    await prisma.movimientoInventario.deleteMany()
    await prisma.inventario.deleteMany()
    await prisma.producto.deleteMany()
    await prisma.sucursal.deleteMany()
    await prisma.empresa.deleteMany()

    // Crear datos de prueba
    const empresa = await prisma.empresa.create({
      data: { nombre: 'Empresa Test' }
    })

    const sucursal = await prisma.sucursal.create({
      data: {
        empresaId: empresa.id,
        codigoUnico: 'SUC-TEST-001',
        nombre: 'Sucursal Test',
      }
    })

    const producto = await prisma.producto.create({
      data: {
        sku: 'SKU-TEST-001',
        nombre: 'Producto Test',
        costoUnitario: 100,
        precioVenta: 150,
      }
    })

    // Crear inventario inicial
    await prisma.inventario.create({
      data: {
        sucursalId: sucursal.id,
        productoId: producto.id,
        cantidadActual: 50,
        stockMinimo: 20,
      }
    })

    sucursalId = sucursal.id
    productoId = producto.id
  })

  afterEach(async () => {
    await prisma.movimientoInventario.deleteMany()
    await prisma.inventario.deleteMany()
    await prisma.producto.deleteMany()
    await prisma.sucursal.deleteMany()
    await prisma.empresa.deleteMany()
  })

  it('debe registrar una entrada de inventario', async () => {
    // Arrange
    const datosMovimiento = {
      productoId,
      sucursalId,
      tipo: 'entrada' as const,
      cantidad: 20,
      motivo: 'Compra de mercancía',
    }

    // Act
    const resultado = await registrarMovimiento(datosMovimiento)

    // Assert
    expect(resultado.success).toBe(true)
    expect(resultado.stockAnterior).toBe(50)
    expect(resultado.stockNuevo).toBe(70)

    // Verificar en BD
    const inventario = await prisma.inventario.findUnique({
      where: {
        sucursalId_productoId: { sucursalId, productoId }
      }
    })
    expect(inventario?.cantidadActual).toBe(70)

    // Verificar movimiento registrado
    const movimiento = await prisma.movimientoInventario.findFirst({
      where: { productoId }
    })
    expect(movimiento).toBeDefined()
    expect(movimiento?.tipo).toBe('entrada')
    expect(movimiento?.cantidad).toBe(20)
  })

  it('debe registrar una salida de inventario', async () => {
    // Arrange
    const datosMovimiento = {
      productoId,
      sucursalId,
      tipo: 'salida' as const,
      cantidad: 10,
      motivo: 'Venta',
    }

    // Act
    const resultado = await registrarMovimiento(datosMovimiento)

    // Assert
    expect(resultado.success).toBe(true)
    expect(resultado.stockAnterior).toBe(50)
    expect(resultado.stockNuevo).toBe(40)

    const inventario = await prisma.inventario.findUnique({
      where: {
        sucursalId_productoId: { sucursalId, productoId }
      }
    })
    expect(inventario?.cantidadActual).toBe(40)
  })

  it('debe rechazar salida si stock es insuficiente', async () => {
    // Arrange - Intentar sacar más de lo disponible
    const datosMovimiento = {
      productoId,
      sucursalId,
      tipo: 'salida' as const,
      cantidad: 60, // Solo hay 50
      motivo: 'Venta',
    }

    // Act
    const resultado = await registrarMovimiento(datosMovimiento)

    // Assert
    expect(resultado.success).toBe(false)
    expect(resultado.error).toContain('insuficiente')

    // Verificar que no se modificó el inventario
    const inventario = await prisma.inventario.findUnique({
      where: {
        sucursalId_productoId: { sucursalId, productoId }
      }
    })
    expect(inventario?.cantidadActual).toBe(50) // Sin cambios
  })

  it('debe crear inventario automáticamente si no existe', async () => {
    // Arrange - Crear nuevo producto sin inventario
    const nuevoProducto = await prisma.producto.create({
      data: {
        sku: 'SKU-TEST-002',
        nombre: 'Producto Nuevo',
        costoUnitario: 50,
        precioVenta: 80,
      }
    })

    const datosMovimiento = {
      productoId: nuevoProducto.id,
      sucursalId,
      tipo: 'entrada' as const,
      cantidad: 100,
      motivo: 'Stock inicial',
    }

    // Act
    const resultado = await registrarMovimiento(datosMovimiento)

    // Assert
    expect(resultado.success).toBe(true)
    expect(resultado.stockAnterior).toBe(0) // Se creó con 0
    expect(resultado.stockNuevo).toBe(100)

    // Verificar que se creó el inventario
    const inventario = await prisma.inventario.findUnique({
      where: {
        sucursalId_productoId: { sucursalId, productoId: nuevoProducto.id }
      }
    })
    expect(inventario).toBeDefined()
    expect(inventario?.cantidadActual).toBe(100)
  })

  it('debe registrar múltiples movimientos consecutivos', async () => {
    // Act - Varios movimientos
    await registrarMovimiento({
      productoId,
      sucursalId,
      tipo: 'entrada',
      cantidad: 20,
      motivo: 'Compra',
    })

    await registrarMovimiento({
      productoId,
      sucursalId,
      tipo: 'salida',
      cantidad: 15,
      motivo: 'Venta',
    })

    await registrarMovimiento({
      productoId,
      sucursalId,
      tipo: 'entrada',
      cantidad: 10,
      motivo: 'Devolución',
    })

    // Assert - Stock final
    const inventario = await prisma.inventario.findUnique({
      where: {
        sucursalId_productoId: { sucursalId, productoId }
      }
    })
    expect(inventario?.cantidadActual).toBe(65) // 50 + 20 - 15 + 10

    // Verificar historial de movimientos
    const movimientos = await prisma.movimientoInventario.findMany({
      where: { productoId },
      orderBy: { creado_at: 'asc' }
    })
    expect(movimientos).toHaveLength(3)
  })
})

describe('obtenerMovimientosRecientes - Tests de Integración', () => {
  let sucursalId: string
  let productoId: string

  beforeEach(async () => {
    // Limpiar
    await prisma.movimientoInventario.deleteMany()
    await prisma.inventario.deleteMany()
    await prisma.producto.deleteMany()
    await prisma.sucursal.deleteMany()
    await prisma.empresa.deleteMany()

    // Crear datos de prueba
    const empresa = await prisma.empresa.create({
      data: { nombre: 'Empresa Test' }
    })

    const sucursal = await prisma.sucursal.create({
      data: {
        empresaId: empresa.id,
        codigoUnico: 'SUC-TEST-001',
        nombre: 'Sucursal Test',
      }
    })

    const producto = await prisma.producto.create({
      data: {
        sku: 'SKU-TEST-001',
        nombre: 'Producto Test',
        costoUnitario: 100,
        precioVenta: 150,
      }
    })

    await prisma.inventario.create({
      data: {
        sucursalId: sucursal.id,
        productoId: producto.id,
        cantidadActual: 50,
        stockMinimo: 20,
      }
    })

    sucursalId = sucursal.id
    productoId = producto.id
  })

  afterEach(async () => {
    await prisma.movimientoInventario.deleteMany()
    await prisma.inventario.deleteMany()
    await prisma.producto.deleteMany()
    await prisma.sucursal.deleteMany()
    await prisma.empresa.deleteMany()
  })

  it('debe obtener movimientos recientes con estadísticas', async () => {
    // Arrange - Crear movimientos
    await registrarMovimiento({
      productoId,
      sucursalId,
      tipo: 'entrada',
      cantidad: 30,
      motivo: 'Compra',
    })

    await registrarMovimiento({
      productoId,
      sucursalId,
      tipo: 'salida',
      cantidad: 10,
      motivo: 'Venta',
    })

    // Act
    const resultado = await obtenerMovimientosRecientes(7)

    // Assert
    expect(resultado.success).toBe(true)
    expect(resultado.movimientos).toHaveLength(2)
    expect(resultado.estadisticas).toBeDefined()
    expect(resultado.estadisticas?.totalMovimientos).toBe(2)
    expect(resultado.estadisticas?.totalEntradas).toBe(30)
    expect(resultado.estadisticas?.totalSalidas).toBe(10)
    expect(resultado.estadisticas?.productosUnicos).toBe(1)
  })

  it('debe serializar fechas correctamente', async () => {
    // Arrange
    await registrarMovimiento({
      productoId,
      sucursalId,
      tipo: 'entrada',
      cantidad: 10,
    })

    // Act
    const resultado = await obtenerMovimientosRecientes(7)

    // Assert
    expect(resultado.movimientos[0].creado_at).toBeDefined()
    expect(typeof resultado.movimientos[0].creado_at).toBe('string')
    // Verificar que es ISO string válido
    expect(() => new Date(resultado.movimientos[0].creado_at)).not.toThrow()
  })

  it('debe retornar array vacío si no hay movimientos', async () => {
    // Act
    const resultado = await obtenerMovimientosRecientes(7)

    // Assert
    expect(resultado.success).toBe(true)
    expect(resultado.movimientos).toHaveLength(0)
    expect(resultado.estadisticas?.totalMovimientos).toBe(0)
  })
})
