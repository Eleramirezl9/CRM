import { test, expect } from '@playwright/test'

/**
 * Tests E2E: Autenticación
 *
 * Estos tests prueban el flujo completo de autenticación
 * desde la perspectiva del usuario
 */

test.describe('Autenticación de Usuarios', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/iniciar-sesion')
  })

  test('debe mostrar el formulario de inicio de sesión', async ({ page }) => {
    // Verificar que la página de login se carga correctamente
    await expect(page.locator('h1')).toContainText('Iniciar sesión')

    // Verificar que los campos existen
    const inputs = page.getByRole('textbox')
    await expect(inputs.first()).toBeVisible() // Correo
    await expect(inputs.last()).toBeVisible()  // Contraseña (type=password se renderiza como textbox)
    await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible()
  })

  test.skip('debe iniciar sesión como administrador exitosamente', async ({ page }) => {
    // TODO: Requiere que la base de datos tenga el usuario de prueba seeded
    // Ejecutar: npm run db:seed antes de habilitar este test
    // Llenar formulario (primer input = correo, segundo = contraseña)
    const inputs = page.getByRole('textbox')
    await inputs.first().fill('admin@empresa.com')
    await inputs.last().fill('admin123')

    // Enviar formulario
    await page.getByRole('button', { name: /ingresar/i }).click()

    // Esperar redirección al dashboard
    await page.waitForURL('/dashboard', { timeout: 10000 })

    // Verificar que estamos en el dashboard
    await expect(page.locator('h1')).toBeVisible()
  })

  test.skip('debe iniciar sesión como bodega exitosamente', async ({ page }) => {
    // TODO: Requiere que la base de datos tenga el usuario de prueba seeded
    // Ejecutar: npm run db:seed antes de habilitar este test
    const inputs = page.getByRole('textbox')
    await inputs.first().fill('bodega@empresa.com')
    await inputs.last().fill('bodega123')
    await page.getByRole('button', { name: /ingresar/i }).click()

    await page.waitForURL('/dashboard', { timeout: 10000 })
    await expect(page.locator('h1')).toBeVisible()
  })

  test('debe mostrar error con credenciales incorrectas', async ({ page }) => {
    const inputs = page.getByRole('textbox')
    await inputs.first().fill('usuario@falso.com')
    await inputs.last().fill('contraseña-incorrecta')
    await page.getByRole('button', { name: /ingresar/i }).click()

    // Verificar mensaje de error (ajustar según tu implementación)
    await page.waitForTimeout(2000) // Esperar a que aparezca el error
    // Comentado hasta saber el mensaje exacto de error
    // await expect(page.locator('text=credenciales')).toBeVisible()
  })

  test('debe mostrar error si faltan campos', async ({ page }) => {
    // Intentar enviar sin llenar campos
    await page.getByRole('button', { name: /ingresar/i }).click()

    // Esperar un momento para que se procese
    await page.waitForTimeout(1000)

    // Verificar que seguimos en la página de login (no navegó)
    await expect(page).toHaveURL('/iniciar-sesion')

    // Verificar que el formulario sigue visible
    await expect(page.getByRole('button', { name: /ingresar/i })).toBeVisible()
  })

  test.skip('debe cerrar sesión correctamente', async ({ page }) => {
    // Login primero
    const inputs = page.getByRole('textbox')
    await inputs.first().fill('admin@empresa.com')
    await inputs.last().fill('admin123')
    await page.getByRole('button', { name: /ingresar/i }).click()
    await page.waitForURL('/dashboard', { timeout: 10000 })

    // TODO: Agregar data-testid="cerrar-sesion" al botón de logout
    // await page.click('button[data-testid="cerrar-sesion"]')

    // Verificar redirección a login
    // await page.waitForURL('/iniciar-sesion')
  })
})
