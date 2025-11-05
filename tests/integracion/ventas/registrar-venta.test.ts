/**
 * Test de Integración: Registrar Venta
 *
 * Este test prueba el flujo completo de registrar una venta:
 * 1. Crear venta en BD
 * 2. Crear items de venta
 * 3. Actualizar inventario
 *
 * Requiere base de datos de prueba configurada
 */

import { registrarVenta } from '@/caracteristicas/ventas/acciones'
import { prisma } from '@/lib/prisma'

// Nota: Este test requiere una BD de prueba separada
// Configurar DATABASE_URL en .env.test

describe('registrarVenta - Tests de Integración', () => {
  let sucursalId: string
  let productoId: string
  let vendedorId: number

  // Preparar datos de prueba antes de cada test
  beforeEach(async () => {
    // Limpiar datos previos
    await prisma.ventaItem.deleteMany()
    await prisma.venta.deleteMany()
    await prisma.movimientoInventario.deleteMany()
    await prisma.inventario.deleteMany()
    await prisma.producto.deleteMany()
    await prisma.sucursal.deleteMany()
    await prisma.usuario.deleteMany()
    await prisma.role.deleteMany()
    await prisma.empresa.deleteMany()

    // Crear datos de prueba
    const empresa = await prisma.empresa.create({
      data: { nombre: 'Empresa Test' }
    })

    const rol = await prisma.role.create({
      data: { nombre: 'administrador' }
    })

    const usuario = await prisma.usuario.create({
      data: {
        correo: 'test@test.com',
        nombre: 'Test User',
        contrasenaHash: 'hash',
        rolId: rol.id,
      }
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
        cantidadActual: 100,
        stockMinimo: 20,
      }
    })

    sucursalId = sucursal.id
    productoId = producto.id
    vendedorId = usuario.id
  })

  // Limpiar después de cada test
  afterEach(async () => {
    await prisma.ventaItem.deleteMany()
    await prisma.venta.deleteMany()
    await prisma.movimientoInventario.deleteMany()
    await prisma.inventario.deleteMany()
    await prisma.producto.deleteMany()
    await prisma.sucursal.deleteMany()
    await prisma.usuario.deleteMany()
    await prisma.role.deleteMany()
    await prisma.empresa.deleteMany()
  })

  it('debe registrar una venta y actualizar el inventario', async () => {
    // Arrange
    const datosVenta = {
      sucursalId,
      vendedorId,
      metodoPago: 'efectivo',
      items: [
        {
          productoId,
          cantidad: 5,
          precioUnitario: 150,
        }
      ]
    }

    // Obtener inventario antes
    const inventarioAntes = await prisma.inventario.findFirst({
      where: { productoId, sucursalId }
    })

    // Act
    const resultado = await registrarVenta(datosVenta)

    // Assert - Venta creada
    expect(resultado.success).toBe(true)
    expect(resultado.venta).toBeDefined()

    // Verificar venta en BD
    const ventaEnBD = await prisma.venta.findUnique({
      where: { id: resultado.venta.id },
      include: { items: true }
    })

    expect(ventaEnBD).toBeDefined()
    expect(ventaEnBD?.totalVenta).toEqual(750) // 5 * 150
    expect(ventaEnBD?.items).toHaveLength(1)

    // Verificar inventario actualizado
    const inventarioDespues = await prisma.inventario.findFirst({
      where: { productoId, sucursalId }
    })

    expect(inventarioDespues?.cantidadActual).toBe(
      inventarioAntes!.cantidadActual - 5
    )
  })

  it('debe crear múltiples items de venta', async () => {
    // Arrange - Crear segundo producto
    const producto2 = await prisma.producto.create({
      data: {
        sku: 'SKU-TEST-002',
        nombre: 'Producto Test 2',
        costoUnitario: 200,
        precioVenta: 300,
      }
    })

    await prisma.inventario.create({
      data: {
        sucursalId,
        productoId: producto2.id,
        cantidadActual: 50,
        stockMinimo: 10,
      }
    })

    const datosVenta = {
      sucursalId,
      vendedorId,
      metodoPago: 'efectivo',
      items: [
        { productoId, cantidad: 2, precioUnitario: 150 },
        { productoId: producto2.id, cantidad: 3, precioUnitario: 300 },
      ]
    }

    // Act
    const resultado = await registrarVenta(datosVenta)

    // Assert
    const ventaEnBD = await prisma.venta.findUnique({
      where: { id: resultado.venta.id },
      include: { items: true }
    })

    expect(ventaEnBD?.items).toHaveLength(2)
    expect(ventaEnBD?.totalVenta).toEqual(1200) // (2*150) + (3*300)
  })

  it('debe rechazar venta si no hay suficiente inventario', async () => {
    // Arrange - Venta con cantidad mayor al inventario
    const datosVenta = {
      sucursalId,
      vendedorId,
      metodoPago: 'efectivo',
      items: [
        { productoId, cantidad: 150, precioUnitario: 150 } // Solo hay 100
      ]
    }

    // Act
    const resultado = await registrarVenta(datosVenta)

    // Assert
    expect(resultado.success).toBe(false)
    expect(resultado.error).toContain('inventario')

    // Verificar que no se creó la venta
    const ventasEnBD = await prisma.venta.count()
    expect(ventasEnBD).toBe(0)
  })
})
