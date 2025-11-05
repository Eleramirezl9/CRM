/**
 * Test de Integración: Registrar Movimiento de Inventario
 *
 * Prueba el flujo completo de registrar movimientos (entradas/salidas)
 */

import { registrarMovimiento } from '@/caracteristicas/inventario/acciones'
import { prisma } from '@/lib/prisma'

describe('registrarMovimiento - Tests de Integración', () => {
  let inventarioId: number
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

    const inventario = await prisma.inventario.create({
      data: {
        sucursalId: sucursal.id,
        productoId: producto.id,
        cantidadActual: 50,
        stockMinimo: 20,
      }
    })

    inventarioId = inventario.id
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
      inventarioId,
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
      where: { id: inventarioId }
    })
    expect(inventario?.cantidadActual).toBe(70)

    // Verificar movimiento registrado
    const movimiento = await prisma.movimientoInventario.findFirst({
      where: { inventarioId }
    })
    expect(movimiento).toBeDefined()
    expect(movimiento?.tipo).toBe('entrada')
    expect(movimiento?.cantidad).toBe(20)
  })

  it('debe registrar una salida de inventario', async () => {
    // Arrange
    const datosMovimiento = {
      inventarioId,
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
      where: { id: inventarioId }
    })
    expect(inventario?.cantidadActual).toBe(40)
  })

  it('debe rechazar salida si stock es insuficiente', async () => {
    // Arrange - Intentar sacar más de lo disponible
    const datosMovimiento = {
      inventarioId,
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
      where: { id: inventarioId }
    })
    expect(inventario?.cantidadActual).toBe(50) // Sin cambios
  })

  it('debe registrar múltiples movimientos consecutivos', async () => {
    // Act - Varios movimientos
    await registrarMovimiento({
      inventarioId,
      tipo: 'entrada',
      cantidad: 20,
      motivo: 'Compra',
    })

    await registrarMovimiento({
      inventarioId,
      tipo: 'salida',
      cantidad: 15,
      motivo: 'Venta',
    })

    await registrarMovimiento({
      inventarioId,
      tipo: 'entrada',
      cantidad: 10,
      motivo: 'Devolución',
    })

    // Assert - Stock final
    const inventario = await prisma.inventario.findUnique({
      where: { id: inventarioId }
    })
    expect(inventario?.cantidadActual).toBe(65) // 50 + 20 - 15 + 10

    // Verificar historial de movimientos
    const movimientos = await prisma.movimientoInventario.findMany({
      where: { inventarioId },
      orderBy: { createdAt: 'asc' }
    })
    expect(movimientos).toHaveLength(3)
  })
})
