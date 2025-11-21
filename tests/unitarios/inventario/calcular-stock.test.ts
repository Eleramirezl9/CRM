// Mock de Prisma DEBE ir antes de importar la función
jest.mock('@/lib/prisma', () => ({
  prisma: {
    inventario: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      upsert: jest.fn(),
    },
  },
}))

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

import { obtenerInventarioGlobal } from '@/caracteristicas/inventario/acciones'
import { prisma } from '@/lib/prisma'
import { INVENTARIO_PRUEBA, PRODUCTO_PRUEBA, SUCURSAL_PRUEBA } from '../../setup/mocks/datos-prueba'

const prismaMock = prisma as jest.Mocked<typeof prisma>

describe('obtenerInventarioGlobal - Tests Unitarios', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('debe obtener el inventario consolidado correctamente', async () => {
    // Arrange
    const inventarios = [
      {
        ...INVENTARIO_PRUEBA,
        producto: PRODUCTO_PRUEBA,
        sucursal: SUCURSAL_PRUEBA,
      },
      {
        ...INVENTARIO_PRUEBA,
        id: 2,
        cantidadActual: 50,
        sucursal: { ...SUCURSAL_PRUEBA, id: 'suc-test-2', nombre: 'Sucursal 2' },
        producto: PRODUCTO_PRUEBA,
      },
    ]

    prismaMock.inventario.findMany.mockResolvedValue(inventarios as any)

    // Act
    const resultado = await obtenerInventarioGlobal()

    // Assert
    expect(resultado.success).toBe(true)
    expect(resultado.consolidado).toHaveLength(1) // Un producto
    expect(resultado.consolidado[0].stockTotal).toBe(150) // 100 + 50
  })

  it('debe detectar stock crítico correctamente', async () => {
    // Arrange
    const inventarios = [
      {
        ...INVENTARIO_PRUEBA,
        cantidadActual: 15, // Menor que stockMinimo (20)
        producto: PRODUCTO_PRUEBA,
        sucursal: SUCURSAL_PRUEBA,
      },
    ]

    prismaMock.inventario.findMany.mockResolvedValue(inventarios as any)

    // Act
    const resultado = await obtenerInventarioGlobal()

    // Assert
    expect(resultado.success).toBe(true)
    expect(resultado.consolidado[0].alertaCritica).toBe(true)
  })

  it('debe agrupar inventarios por producto', async () => {
    // Arrange
    const inventarios = [
      {
        ...INVENTARIO_PRUEBA,
        producto: PRODUCTO_PRUEBA,
        sucursal: SUCURSAL_PRUEBA,
      },
      {
        ...INVENTARIO_PRUEBA,
        id: 2,
        productoId: 'prod-test-2',
        producto: { ...PRODUCTO_PRUEBA, id: 'prod-test-2', nombre: 'Producto 2' },
        sucursal: SUCURSAL_PRUEBA,
      },
    ]

    prismaMock.inventario.findMany.mockResolvedValue(inventarios as any)

    // Act
    const resultado = await obtenerInventarioGlobal()

    // Assert
    expect(resultado.success).toBe(true)
    expect(resultado.consolidado).toHaveLength(2) // Dos productos diferentes
  })

  it('debe manejar errores de base de datos', async () => {
    // Arrange
    prismaMock.inventario.findMany.mockRejectedValue(new Error('Error de BD'))

    // Act
    const resultado = await obtenerInventarioGlobal()

    // Assert
    expect(resultado.success).toBe(false)
    expect(resultado.error).toBeDefined()
    expect(resultado.consolidado).toEqual([])
  })
})
