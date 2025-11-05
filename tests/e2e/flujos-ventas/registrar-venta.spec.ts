import { test, expect } from '@playwright/test'

/**
 * Tests E2E: Flujo Completo de Ventas
 *
 * Prueba el proceso completo de registrar una venta
 * desde el login hasta la confirmación
 */

test.describe('Flujo de Registro de Venta', () => {
  // data-testid agregados a los componentes de ventas
  test.beforeEach(async ({ page }) => {
    // Login como administrador antes de cada test
    await page.goto('/iniciar-sesion')
    const inputs = page.getByRole('textbox')
    await inputs.first().fill('admin@empresa.com')
    await inputs.last().fill('admin123')
    await page.getByRole('button', { name: /ingresar/i }).click()
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test.skip('debe registrar una venta simple exitosamente', async ({ page }) => {
    // TODO: Este test necesita que primero se seleccione una sucursal y haya productos
    // 1. Navegar a ventas
    await page.goto('/dashboard/ventas')
    await expect(page.locator('h1')).toContainText('Ventas')

    // 2. Seleccionar sucursal primero
    // await page.selectOption('select', 'suc-id')

    // 3. Agregar producto al carrito
    await page.click('[data-testid="agregar-producto-1"]')

    // 4. Modificar cantidad (ya está en el carrito)
    await page.fill('[data-testid="cantidad-1"]', '2')

    // 5. Seleccionar método de pago
    await page.selectOption('[data-testid="metodo-pago"]', 'efectivo')

    // 6. Registrar venta
    await page.click('[data-testid="registrar-venta"]')

    // 7. Verificar mensaje de éxito
    await page.waitForTimeout(2000)
    // await expect(page.locator('.toast-success')).toBeVisible()

    // 8. Verificar que el carrito se vació
    const carritoVacio = page.locator('[data-testid="carrito-vacio"]')
    await expect(carritoVacio).toBeVisible()
  })

  test.skip('debe calcular el total correctamente', async ({ page }) => {
    // TODO: Requiere seleccionar sucursal y que productos tengan precios específicos
    await page.goto('/dashboard/ventas')

    // Agregar primer producto (precio: $150, cantidad: 2)
    await page.click('[data-testid="agregar-producto-1"]')
    await page.fill('[data-testid="cantidad-1"]', '2')

    // Agregar segundo producto (precio: $200, cantidad: 1)
    await page.click('[data-testid="agregar-producto-2"]')
    await page.fill('[data-testid="cantidad-2"]', '1')

    // Verificar total: (150 * 2) + (200 * 1) = 500
    const total = page.locator('[data-testid="total-venta"]')
    await expect(total).toContainText('$500')
  })

  test('debe mostrar error si el carrito está vacío', async ({ page }) => {
    await page.goto('/dashboard/ventas')
    await expect(page.locator('h1')).toContainText('Ventas')

    // Verificar que el botón está deshabilitado cuando carrito vacío
    const boton = page.locator('[data-testid="registrar-venta"]')
    await expect(boton).toBeDisabled()
  })

  test.skip('debe permitir eliminar productos del carrito', async ({ page }) => {
    // TODO: Requiere seleccionar sucursal primero
    await page.goto('/dashboard/ventas')

    // Agregar producto
    await page.click('[data-testid="agregar-producto-1"]')

    // Verificar que está en el carrito
    await expect(page.locator('[data-testid="item-carrito-1"]')).toBeVisible()

    // Eliminar producto
    await page.click('[data-testid="eliminar-item-1"]')

    // Verificar que se eliminó
    await expect(page.locator('[data-testid="item-carrito-1"]')).not.toBeVisible()
  })

  test.skip('debe actualizar el inventario después de la venta', async ({ page }) => {
    // TODO: Test de integración completo - requiere setup complejo
    // 1. Verificar inventario inicial
    await page.goto('/dashboard/inventario')
    const stockInicial = await page.locator('[data-testid="stock-1"]').textContent()

    // 2. Registrar venta
    await page.goto('/dashboard/ventas')
    await page.click('[data-testid="agregar-producto-1"]')
    await page.fill('[data-testid="cantidad-1"]', '5')
    await page.selectOption('[data-testid="metodo-pago"]', 'efectivo')
    await page.click('[data-testid="registrar-venta"]')

    // Esperar confirmación
    await page.waitForTimeout(2000)

    // 3. Verificar inventario actualizado
    await page.goto('/dashboard/inventario')
    const stockFinal = await page.locator('[data-testid="stock-1"]').textContent()

    // Verificar que se restaron 5 unidades
    expect(parseInt(stockFinal!)).toBe(parseInt(stockInicial!) - 5)
  })

  test('debe mostrar historial de ventas', async ({ page }) => {
    await page.goto('/dashboard/ventas')

    // Ver historial
    await page.click('[data-testid="ver-historial"]')

    // Verificar que se muestra la tabla (puede estar vacía o con datos)
    await expect(page.locator('table')).toBeVisible()
  })
})

test.describe('Métodos de Pago', () => {
  // data-testid agregados a los componentes de ventas
  test.beforeEach(async ({ page }) => {
    await page.goto('/iniciar-sesion')
    const inputs = page.getByRole('textbox')
    await inputs.first().fill('admin@empresa.com')
    await inputs.last().fill('admin123')
    await page.getByRole('button', { name: /ingresar/i }).click()
    await page.waitForURL('/dashboard', { timeout: 10000 })
    await page.goto('/dashboard/ventas')
  })

  test('debe mostrar selector de método de pago', async ({ page }) => {
    // Verificar que el selector de método de pago existe
    const selectMetodoPago = page.locator('[data-testid="metodo-pago"]')
    await expect(selectMetodoPago).toBeVisible()

    // Verificar que tiene opciones
    await expect(selectMetodoPago.locator('option[value="efectivo"]')).toBeVisible()
    await expect(selectMetodoPago.locator('option[value="tarjeta"]')).toBeVisible()
  })

  test.skip('debe permitir pago en efectivo', async ({ page }) => {
    // TODO: Requiere seleccionar sucursal y agregar productos
    await page.click('[data-testid="agregar-producto-1"]')
    await page.selectOption('[data-testid="metodo-pago"]', 'efectivo')
    await page.click('[data-testid="registrar-venta"]')

    await page.waitForTimeout(2000)
  })

  test.skip('debe permitir pago con tarjeta', async ({ page }) => {
    // TODO: Requiere seleccionar sucursal y agregar productos
    await page.click('[data-testid="agregar-producto-1"]')
    await page.selectOption('[data-testid="metodo-pago"]', 'tarjeta')
    await page.click('[data-testid="registrar-venta"]')

    await page.waitForTimeout(2000)
  })
})
