import { test, expect } from '@playwright/test'

/**
 * Tests E2E: Gestión de Inventario
 *
 * Prueba el flujo completo de gestión de inventario
 */

test.describe('Flujo de Gestión de Inventario', () => {
  // data-testid agregados a los componentes de inventario
  test.beforeEach(async ({ page }) => {
    // Login como administrador
    await page.goto('/iniciar-sesion')
    const inputs = page.getByRole('textbox')
    await inputs.first().fill('admin@empresa.com')
    await inputs.last().fill('admin123')
    await page.getByRole('button', { name: /ingresar/i }).click()
    await page.waitForURL('/dashboard', { timeout: 10000 })
  })

  test('debe mostrar lista de inventario', async ({ page }) => {
    await page.goto('/dashboard/inventario')

    // Verificar que se muestra la tabla
    await expect(page.locator('h1')).toContainText('Inventario')
    await expect(page.locator('table')).toBeVisible()

    // Verificar que hay productos
    const filas = page.locator('tbody tr')
    await expect(filas.first()).toBeVisible()
  })

  test('debe registrar entrada de inventario', async ({ page }) => {
    await page.goto('/dashboard/inventario')

    // Obtener stock inicial
    const stockInicial = await page.locator('[data-testid="stock-1"]').textContent()

    // Abrir diálogo de movimiento
    await page.click('[data-testid="registrar-movimiento-1"]')

    // Seleccionar tipo entrada
    await page.selectOption('[data-testid="tipo-movimiento"]', 'entrada')

    // Ingresar cantidad
    await page.fill('[data-testid="cantidad-movimiento"]', '20')

    // Ingresar motivo
    await page.fill('[data-testid="motivo-movimiento"]', 'Compra de mercancía')

    // Confirmar
    await page.click('[data-testid="confirmar-movimiento"]')

    // Verificar éxito
    await expect(page.locator('.toast-success')).toBeVisible()

    // Verificar stock actualizado
    const stockFinal = await page.locator('[data-testid="stock-1"]').textContent()
    expect(parseInt(stockFinal!)).toBe(parseInt(stockInicial!) + 20)
  })

  test('debe registrar salida de inventario', async ({ page }) => {
    await page.goto('/dashboard/inventario')

    const stockInicial = await page.locator('[data-testid="stock-1"]').textContent()

    await page.click('[data-testid="registrar-movimiento-1"]')
    await page.selectOption('[data-testid="tipo-movimiento"]', 'salida')
    await page.fill('[data-testid="cantidad-movimiento"]', '10')
    await page.fill('[data-testid="motivo-movimiento"]', 'Ajuste de inventario')
    await page.click('[data-testid="confirmar-movimiento"]')

    await expect(page.locator('.toast-success')).toBeVisible()

    const stockFinal = await page.locator('[data-testid="stock-1"]').textContent()
    expect(parseInt(stockFinal!)).toBe(parseInt(stockInicial!) - 10)
  })

  test('debe mostrar alertas de stock crítico', async ({ page }) => {
    await page.goto('/dashboard/inventario')

    // Buscar productos con alerta crítica
    const alertas = page.locator('[data-testid="alerta-critica"]')

    // Verificar que se muestran las alertas (si existen)
    const count = await alertas.count()
    if (count > 0) {
      await expect(alertas.first()).toBeVisible()
      await expect(alertas.first()).toHaveClass(/bg-red/)
    }
  })

  test('debe filtrar inventario por sucursal', async ({ page }) => {
    await page.goto('/dashboard/inventario')

    // Seleccionar filtro de sucursal
    await page.selectOption('[data-testid="filtro-sucursal"]', 'suc-test-1')

    // Verificar que se filtró
    await page.waitForSelector('table tbody tr')

    const filas = page.locator('tbody tr')
    const primeraFila = filas.first()

    // Verificar que pertenece a la sucursal seleccionada
    await expect(primeraFila.locator('[data-testid="nombre-sucursal"]'))
      .toContainText('Sucursal Test 1')
  })

  test('debe mostrar historial de movimientos', async ({ page }) => {
    await page.goto('/dashboard/inventario')

    // Click en ver historial
    await page.click('[data-testid="ver-historial"]')

    // Verificar que se muestra la tabla de movimientos
    await expect(page.locator('h2')).toContainText('Historial')
    await expect(page.locator('table')).toBeVisible()

    // Verificar columnas importantes
    await expect(page.locator('th')).toContainText('Tipo')
    await expect(page.locator('th')).toContainText('Cantidad')
    await expect(page.locator('th')).toContainText('Motivo')
  })

  test('debe rechazar salida si no hay suficiente stock', async ({ page }) => {
    await page.goto('/dashboard/inventario')

    // Obtener stock actual
    const stockActual = await page.locator('[data-testid="stock-1"]').textContent()

    // Intentar sacar más de lo disponible
    await page.click('[data-testid="registrar-movimiento-1"]')
    await page.selectOption('[data-testid="tipo-movimiento"]', 'salida')
    await page.fill('[data-testid="cantidad-movimiento"]', (parseInt(stockActual!) + 100).toString())
    await page.click('[data-testid="confirmar-movimiento"]')

    // Verificar error
    await expect(page.locator('.toast-error')).toBeVisible()
    await expect(page.locator('.toast-error')).toContainText('insuficiente')
  })
})
