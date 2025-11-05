// Mock de Prisma DEBE ir antes de importar la función
jest.mock('@/lib/prisma', () => ({
  prisma: {
    producto: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}))

import { crearProducto } from '@/caracteristicas/productos/acciones'
import { prisma } from '@/lib/prisma'
import { PRODUCTO_PRUEBA } from '../../setup/mocks/datos-prueba'

const prismaMock = prisma as jest.Mocked<typeof prisma>

describe('crearProducto - Tests Unitarios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('debe crear un producto exitosamente', async () => {
    // Arrange - Preparar
    const datosProducto = {
      nombre: 'Nuevo Producto',
      descripcion: 'Descripción del producto',
      costoUnitario: 100,
      precioVenta: 150,
      unidadMedida: 'unidad',
    }

    const productoMock = {
      ...PRODUCTO_PRUEBA,
      nombre: datosProducto.nombre,
      descripcion: datosProducto.descripcion,
    }

    prismaMock.producto.create.mockResolvedValue(productoMock as any)

    // Act - Ejecutar
    const resultado = await crearProducto(datosProducto)

    // Assert - Verificar
    expect(resultado.success).toBe(true)
    expect(resultado.producto).toBeDefined()
    expect(resultado.producto?.nombre).toBe(datosProducto.nombre)
    expect(prismaMock.producto.create).toHaveBeenCalledTimes(1)
  })

  it('debe generar un SKU automáticamente', async () => {
    // Arrange
    const datosProducto = {
      nombre: 'Producto Test',
      costoUnitario: 100,
      precioVenta: 150,
    }

    prismaMock.producto.create.mockResolvedValue(PRODUCTO_PRUEBA as any)

    // Act
    await crearProducto(datosProducto)

    // Assert
    expect(prismaMock.producto.create).toHaveBeenCalled()
    const llamadaCreate = prismaMock.producto.create.mock.calls[0][0]
    expect(llamadaCreate.data.sku).toMatch(/^SKU-/)
  })

  it('debe retornar error si falla la creación', async () => {
    // Arrange
    const datosProducto = {
      nombre: 'Producto Test',
      costoUnitario: 100,
      precioVenta: 150,
    }

    prismaMock.producto.create.mockRejectedValue(new Error('Error de BD'))

    // Act
    const resultado = await crearProducto(datosProducto)

    // Assert
    expect(resultado.success).toBe(false)
    expect(resultado.error).toBeDefined()
  })

  it('debe usar "unidad" como unidad de medida por defecto', async () => {
    // Arrange
    const datosProducto = {
      nombre: 'Producto Test',
      costoUnitario: 100,
      precioVenta: 150,
    }

    prismaMock.producto.create.mockResolvedValue(PRODUCTO_PRUEBA as any)

    // Act
    await crearProducto(datosProducto)

    // Assert
    expect(prismaMock.producto.create).toHaveBeenCalled()
    const llamadaCreate = prismaMock.producto.create.mock.calls[0][0]
    expect(llamadaCreate.data.unidadMedida).toBe('unidad')
  })
})
