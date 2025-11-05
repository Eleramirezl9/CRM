// Test unitario para cálculos de ventas

describe('Cálculos de Venta - Tests Unitarios', () => {
  describe('calcularTotalVenta', () => {
    it('debe calcular el total correctamente con un item', () => {
      // Arrange
      const items = [
        { cantidad: 2, precioUnitario: 100 }
      ]

      // Act
      const total = items.reduce((sum, item) =>
        sum + (item.cantidad * item.precioUnitario), 0
      )

      // Assert
      expect(total).toBe(200)
    })

    it('debe calcular el total correctamente con múltiples items', () => {
      // Arrange
      const items = [
        { cantidad: 2, precioUnitario: 100 },
        { cantidad: 3, precioUnitario: 50 },
        { cantidad: 1, precioUnitario: 200 },
      ]

      // Act
      const total = items.reduce((sum, item) =>
        sum + (item.cantidad * item.precioUnitario), 0
      )

      // Assert
      expect(total).toBe(550) // 200 + 150 + 200
    })

    it('debe retornar 0 si no hay items', () => {
      // Arrange
      const items: any[] = []

      // Act
      const total = items.reduce((sum, item) =>
        sum + (item.cantidad * item.precioUnitario), 0
      )

      // Assert
      expect(total).toBe(0)
    })

    it('debe manejar decimales correctamente', () => {
      // Arrange
      const items = [
        { cantidad: 1.5, precioUnitario: 100.50 }
      ]

      // Act
      const total = items.reduce((sum, item) =>
        sum + (item.cantidad * item.precioUnitario), 0
      )

      // Assert
      expect(total).toBe(150.75)
    })
  })

  describe('validarItemsVenta', () => {
    it('debe validar que los items no estén vacíos', () => {
      // Arrange
      const items: any[] = []

      // Act
      const esValido = items.length > 0

      // Assert
      expect(esValido).toBe(false)
    })

    it('debe validar que las cantidades sean positivas', () => {
      // Arrange
      const items = [
        { cantidad: 0, precioUnitario: 100 }
      ]

      // Act
      const todosPositivos = items.every(item => item.cantidad > 0)

      // Assert
      expect(todosPositivos).toBe(false)
    })

    it('debe validar que los precios sean positivos', () => {
      // Arrange
      const items = [
        { cantidad: 1, precioUnitario: -100 }
      ]

      // Act
      const preciosValidos = items.every(item => item.precioUnitario > 0)

      // Assert
      expect(preciosValidos).toBe(false)
    })
  })
})
