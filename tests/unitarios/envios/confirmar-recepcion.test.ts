/**
 * Tests para el flujo de confirmación de recepción de envíos
 *
 * El flujo correcto es:
 * 1. pendiente → en_preparacion → en_transito (descuenta de bodega)
 * 2. en_transito: envío queda pendiente de confirmación en sucursal
 * 3. Sucursal confirma y firma → cambia a "entregado" y agrega al inventario
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock de prisma
const mockPrisma = {
  envio: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
  },
  envioItem: {
    update: jest.fn(),
  },
  inventario: {
    findUnique: jest.fn(),
    upsert: jest.fn(),
  },
  movimientoInventario: {
    create: jest.fn(),
  },
  notificacion: {
    createMany: jest.fn(),
  },
  usuario: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
}

// Mock de módulos
jest.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}))

jest.mock('@/caracteristicas/autenticacion/server', () => ({
  getServerSession: jest.fn(() => ({
    user: {
      id: '1',
      email: 'sucursal@test.com',
      rol: 'sucursal',
      sucursalId: 'suc-destino-1',
    },
  })),
}))

jest.mock('@/compartido/lib/dal', () => ({
  verifySession: jest.fn(() => ({
    user: {
      id: '1',
      email: 'sucursal@test.com',
      rol: 'sucursal',
      sucursalId: 'suc-destino-1',
    },
  })),
}))

jest.mock('@/compartido/lib/permisos', () => ({
  checkPermiso: jest.fn(() => ({ authorized: true })),
  PERMISOS: {
    ENVIOS_CONFIRMAR: 'envios.confirmar',
  },
}))

jest.mock('next/cache', () => ({
  revalidatePath: jest.fn(),
}))

describe('Flujo de Confirmación de Recepción', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('obtenerEnviosPendientesConfirmacion', () => {
    it('debe retornar solo envíos en estado en_transito para la sucursal', async () => {
      const mockEnvios = [
        {
          id: 'envio-1',
          estado: 'en_transito',
          sucursalDestinoId: 'suc-destino-1',
          sucursalOrigen: { nombre: 'Bodega Central' },
          items: [
            {
              productoId: 'prod-1',
              cantidadSolicitada: 10,
              producto: { nombre: 'Pan', sku: 'PAN-001', precioVenta: 5 },
            },
          ],
        },
      ]

      mockPrisma.envio.findMany.mockResolvedValue(mockEnvios)

      const { obtenerEnviosPendientesConfirmacion } = await import(
        '@/caracteristicas/sucursales/acciones'
      )

      const result = await obtenerEnviosPendientesConfirmacion('suc-destino-1')

      expect(result.success).toBe(true)
      expect(result.envios).toHaveLength(1)
      expect(result.envios[0].estado).toBe('en_transito')

      // Verificar que la query filtró por estado correcto
      expect(mockPrisma.envio.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            sucursalDestinoId: 'suc-destino-1',
            estado: 'en_transito',
          },
        })
      )
    })

    it('debe retornar array vacío si no hay envíos pendientes', async () => {
      mockPrisma.envio.findMany.mockResolvedValue([])

      const { obtenerEnviosPendientesConfirmacion } = await import(
        '@/caracteristicas/sucursales/acciones'
      )

      const result = await obtenerEnviosPendientesConfirmacion('suc-destino-1')

      expect(result.success).toBe(true)
      expect(result.envios).toHaveLength(0)
    })
  })

  describe('confirmarRecepcionEnvio', () => {
    const mockEnvio = {
      id: 'envio-1',
      estado: 'en_transito',
      sucursalOrigenId: 'suc-origen-1',
      sucursalDestinoId: 'suc-destino-1',
      items: [
        {
          productoId: 'prod-1',
          cantidadSolicitada: 10,
          producto: { nombre: 'Pan', precioVenta: 5 },
        },
        {
          productoId: 'prod-2',
          cantidadSolicitada: 5,
          producto: { nombre: 'Leche', precioVenta: 10 },
        },
      ],
      sucursalDestino: { nombre: 'Sucursal Sur' },
    }

    it('debe confirmar recepción y agregar al inventario destino', async () => {
      mockPrisma.envio.findUnique.mockResolvedValue(mockEnvio)
      mockPrisma.envio.update.mockResolvedValue({ ...mockEnvio, estado: 'entregado' })
      mockPrisma.inventario.upsert.mockResolvedValue({ id: 1 })
      mockPrisma.movimientoInventario.create.mockResolvedValue({})
      mockPrisma.envioItem.update.mockResolvedValue({})

      const { confirmarRecepcionEnvio } = await import(
        '@/caracteristicas/sucursales/acciones'
      )

      const ajustes = [
        { productoId: 'prod-1', cantidadRecibida: 10 },
        { productoId: 'prod-2', cantidadRecibida: 5 },
      ]

      const result = await confirmarRecepcionEnvio('envio-1', ajustes)

      expect(result.success).toBe(true)

      // Verificar que se actualizó el envío a entregado
      expect(mockPrisma.envio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'envio-1' },
          data: expect.objectContaining({
            estado: 'entregado',
            fechaEntrega: expect.any(Date),
            confirmadoPor: expect.any(Number),
            fechaConfirmacion: expect.any(Date),
          }),
        })
      )

      // Verificar que se agregó al inventario
      expect(mockPrisma.inventario.upsert).toHaveBeenCalledTimes(2)
    })

    it('debe permitir ajustar cantidades recibidas (diferencias)', async () => {
      mockPrisma.envio.findUnique.mockResolvedValue(mockEnvio)
      mockPrisma.envio.update.mockResolvedValue({ ...mockEnvio, estado: 'entregado' })
      mockPrisma.inventario.upsert.mockResolvedValue({ id: 1 })

      const { confirmarRecepcionEnvio } = await import(
        '@/caracteristicas/sucursales/acciones'
      )

      // Recibió menos de lo enviado
      const ajustes = [
        { productoId: 'prod-1', cantidadRecibida: 8 }, // Faltaron 2
        { productoId: 'prod-2', cantidadRecibida: 6 }, // Sobraron 1
      ]

      const result = await confirmarRecepcionEnvio('envio-1', ajustes)

      expect(result.success).toBe(true)

      // Verificar que se registró la cantidad real recibida
      expect(mockPrisma.envioItem.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { cantidadRecibida: 8 },
        })
      )
    })

    it('debe fallar si el usuario no tiene acceso a la sucursal destino', async () => {
      const envioOtraSucursal = {
        ...mockEnvio,
        sucursalDestinoId: 'otra-sucursal',
      }
      mockPrisma.envio.findUnique.mockResolvedValue(envioOtraSucursal)

      const { confirmarRecepcionEnvio } = await import(
        '@/caracteristicas/sucursales/acciones'
      )

      const result = await confirmarRecepcionEnvio('envio-1', [])

      expect(result.success).toBe(false)
      expect(result.error).toContain('No tienes acceso')
    })

    it('debe fallar si el envío no existe', async () => {
      mockPrisma.envio.findUnique.mockResolvedValue(null)

      const { confirmarRecepcionEnvio } = await import(
        '@/caracteristicas/sucursales/acciones'
      )

      const result = await confirmarRecepcionEnvio('envio-inexistente', [])

      expect(result.success).toBe(false)
      expect(result.error).toBe('Envío no encontrado')
    })
  })

  describe('reportarDiferenciaEnvio', () => {
    it('debe crear notificaciones para bodega cuando hay diferencias', async () => {
      const mockEnvio = {
        id: 'envio-1',
        creadorId: 5,
        sucursalOrigen: { nombre: 'Bodega Central' },
        sucursalDestino: { nombre: 'Sucursal Sur' },
        sucursalDestinoId: 'suc-destino-1',
        observaciones: null,
      }

      mockPrisma.envio.findUnique.mockResolvedValue(mockEnvio)
      mockPrisma.usuario.findMany.mockResolvedValue([
        { id: 10 },
        { id: 11 },
      ])
      mockPrisma.notificacion.createMany.mockResolvedValue({ count: 3 })
      mockPrisma.envio.update.mockResolvedValue({})

      const { reportarDiferenciaEnvio } = await import(
        '@/caracteristicas/sucursales/acciones'
      )

      const diferencias = [
        {
          productoId: 'prod-1',
          productoNombre: 'Pan',
          cantidadEsperada: 10,
          cantidadRecibida: 8,
          diferencia: 2,
          tipo: 'faltante' as const,
        },
      ]

      const result = await reportarDiferenciaEnvio('envio-1', diferencias, 'Se recibieron dañados')

      expect(result.success).toBe(true)

      // Verificar que se crearon notificaciones
      expect(mockPrisma.notificacion.createMany).toHaveBeenCalled()

      // Verificar que se actualizaron las observaciones del envío
      expect(mockPrisma.envio.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'envio-1' },
          data: expect.objectContaining({
            observaciones: expect.stringContaining('DIFERENCIAS REPORTADAS'),
          }),
        })
      )
    })
  })
})

describe('Flujo Completo: Envío → Confirmación', () => {
  it('el envío NO debe agregar al inventario cuando pasa a en_transito', async () => {
    // Este test verifica que al pasar a en_transito,
    // solo se descuenta del origen, no se agrega al destino

    mockPrisma.envio.findUnique.mockResolvedValue({
      id: 'envio-1',
      estado: 'en_preparacion',
      sucursalOrigenId: 'bodega',
      sucursalDestinoId: 'sucursal',
      items: [{ productoId: 'prod-1', cantidadSolicitada: 10 }],
    })

    mockPrisma.inventario.findMany.mockResolvedValue([
      { id: 1, sucursalId: 'bodega', productoId: 'prod-1', cantidadActual: 100 },
    ])

    const { actualizarEstadoEnvio } = await import(
      '@/caracteristicas/envios/acciones'
    )

    await actualizarEstadoEnvio('envio-1', 'en_transito')

    // Verificar que NO se hizo upsert en inventario destino
    // (eso solo debe pasar en confirmarRecepcionEnvio)
    const upsertCalls = mockPrisma.inventario.upsert.mock.calls
    const destinoCalls = upsertCalls.filter(
      (call: any) => call[0]?.where?.sucursalId_productoId?.sucursalId === 'sucursal'
    )

    expect(destinoCalls).toHaveLength(0)
  })
})
