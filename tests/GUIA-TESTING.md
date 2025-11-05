# 🧪 Guía de Testing - Instalación y Uso

## 📦 Instalación

### 1. Instalar dependencias de testing

```bash
npm install --save-dev @playwright/test @testing-library/jest-dom @testing-library/react @testing-library/user-event @types/jest jest jest-environment-jsdom jest-mock-extended
```

### 2. Instalar navegadores para Playwright (solo para E2E)

```bash
npx playwright install
```

### 3. Verificar instalación

```bash
npm run test:unit -- --version
```

## 🚀 Uso Rápido

### Desarrollo Diario

```bash
# Durante desarrollo, corre tests unitarios en watch mode
npm run test:unit:watch

# Los tests se reejecutarán automáticamente al guardar cambios
```

### Antes de Commit

```bash
# Corre tests unitarios (rápidos)
npm run test:unit
```

### Antes de Pull Request

```bash
# Corre todos los tests excepto E2E
npm run test

# Genera reporte de cobertura
npm run test:coverage
```

### En CI/CD

```bash
# Corre TODOS los tests incluyendo E2E
npm run test:ci
```

## 📝 Crear un Nuevo Test

### Test Unitario

1. Crear archivo en `tests/unitarios/[feature]/nombre-funcion.test.ts`

```typescript
import { miFuncion } from '@/caracteristicas/[feature]/acciones'
import { prismaMock } from '../../setup/mocks/prisma'
import { DATOS_PRUEBA } from '../../setup/mocks/datos-prueba'

describe('miFuncion', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('debe funcionar correctamente', async () => {
    // Arrange - Preparar
    prismaMock.modelo.create.mockResolvedValue(DATOS_PRUEBA)

    // Act - Ejecutar
    const resultado = await miFuncion(datos)

    // Assert - Verificar
    expect(resultado.success).toBe(true)
  })
})
```

2. Correr el test:

```bash
npm run test:unit nombre-funcion
```

### Test de Integración

1. Crear archivo en `tests/integracion/[feature]/caso-uso.test.ts`

```typescript
import { miServerAction } from '@/caracteristicas/[feature]/acciones'
import { prisma } from '@/lib/prisma'

describe('miServerAction - Integración', () => {
  beforeEach(async () => {
    // Limpiar BD de prueba
    await prisma.modelo.deleteMany()

    // Crear datos de prueba
    await prisma.modelo.create({ data: { ... } })
  })

  afterEach(async () => {
    // Limpiar después del test
    await prisma.modelo.deleteMany()
  })

  it('debe realizar operación completa con BD', async () => {
    const resultado = await miServerAction(datos)

    expect(resultado.success).toBe(true)

    // Verificar en BD
    const registro = await prisma.modelo.findFirst()
    expect(registro).toBeDefined()
  })
})
```

2. Correr el test:

```bash
npm run test:integration caso-uso
```

### Test E2E

1. Crear archivo en `tests/e2e/flujos-[feature]/flujo.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Flujo de [Feature]', () => {
  test.beforeEach(async ({ page }) => {
    // Login
    await page.goto('/iniciar-sesion')
    await page.fill('input[name="correo"]', 'admin@empresa.com')
    await page.fill('input[type="password"]', 'admin123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('debe completar flujo exitosamente', async ({ page }) => {
    await page.goto('/dashboard/[feature]')

    await page.click('[data-testid="accion"]')

    await expect(page.locator('.toast-success')).toBeVisible()
  })
})
```

2. Correr el test:

```bash
# Modo headless (sin ver navegador)
npm run test:e2e flujo.spec

# Modo headed (viendo el navegador)
npm run test:e2e:headed flujo.spec

# Modo UI (interfaz interactiva)
npm run test:e2e:ui
```

## 🎯 Ejemplos por Caso de Uso

### Testear Server Action que crea un registro

```typescript
// tests/unitarios/productos/crear-producto.test.ts
import { crearProducto } from '@/caracteristicas/productos/acciones'
import { prismaMock } from '../../setup/mocks/prisma'

it('debe crear producto con SKU generado', async () => {
  const datos = {
    nombre: 'Producto Test',
    costoUnitario: 100,
    precioVenta: 150,
  }

  prismaMock.producto.create.mockResolvedValue({
    id: '1',
    sku: 'SKU-TEST-123',
    ...datos,
  })

  const resultado = await crearProducto(datos)

  expect(resultado.success).toBe(true)
  expect(resultado.producto.sku).toMatch(/^SKU-/)
})
```

### Testear transacción compleja

```typescript
// tests/integracion/ventas/registrar-venta.test.ts
it('debe registrar venta y actualizar inventario atomicamente', async () => {
  // Crear datos iniciales
  const producto = await prisma.producto.create({ ... })
  const inventario = await prisma.inventario.create({
    data: { productoId: producto.id, cantidadActual: 100 }
  })

  // Ejecutar venta
  const resultado = await registrarVenta({
    items: [{ productoId: producto.id, cantidad: 5 }]
  })

  // Verificar venta
  expect(resultado.success).toBe(true)

  // Verificar inventario actualizado
  const inventarioActualizado = await prisma.inventario.findUnique({
    where: { id: inventario.id }
  })
  expect(inventarioActualizado.cantidadActual).toBe(95) // 100 - 5
})
```

### Testear flujo de usuario completo

```typescript
// tests/e2e/flujos-ventas/venta-completa.spec.ts
test('usuario puede realizar venta completa', async ({ page }) => {
  // 1. Login
  await page.goto('/iniciar-sesion')
  await page.fill('input[name="correo"]', 'admin@empresa.com')
  await page.fill('input[type="password"]', 'admin123')
  await page.click('button[type="submit"]')

  // 2. Ir a ventas
  await page.goto('/dashboard/ventas')

  // 3. Agregar productos
  await page.click('[data-testid="agregar-producto-1"]')
  await page.fill('[data-testid="cantidad-1"]', '2')

  // 4. Verificar total
  await expect(page.locator('[data-testid="total"]'))
    .toContainText('$300')

  // 5. Registrar
  await page.selectOption('[data-testid="metodo-pago"]', 'efectivo')
  await page.click('[data-testid="registrar-venta"]')

  // 6. Verificar éxito
  await expect(page.locator('.toast-success')).toBeVisible()
})
```

## 🐛 Debugging

### Ver qué tests están corriendo

```bash
npm run test:unit -- --verbose
```

### Correr un solo archivo de test

```bash
npm run test:unit crear-producto.test
```

### Correr un solo test dentro de un archivo

```bash
npm run test:unit -- -t "debe crear producto"
```

### Debugging de E2E

```bash
# Ver el navegador mientras corre
npm run test:e2e:headed

# Modo debug paso a paso
npm run test:e2e:ui
```

### Ver cobertura en el navegador

```bash
npm run test:coverage
# Abre: coverage/lcov-report/index.html
```

## 📊 Interpretar Resultados

### Cobertura

```
File         | % Stmts | % Branch | % Funcs | % Lines
-------------|---------|----------|---------|--------
productos/   |   85.5  |   80.2   |   90.0  |   85.5
  acciones.ts|   85.5  |   80.2   |   90.0  |   85.5
```

- **% Stmts**: % de líneas ejecutadas
- **% Branch**: % de ifs/switches cubiertos
- **% Funcs**: % de funciones testeadas
- **% Lines**: % de líneas ejecutadas

**Meta**: >80% en todas las columnas para código crítico

### Tests fallando

```
FAIL tests/unitarios/productos/crear-producto.test.ts
  ● debe crear producto

    expect(received).toBe(expected)

    Expected: true
    Received: false
```

El test esperaba `true` pero recibió `false`. Revisar la lógica.

## ⚡ Tips de Productividad

### 1. Usar watch mode durante desarrollo

```bash
npm run test:unit:watch
```

Los tests se reejecutarán automáticamente al guardar.

### 2. Correr solo tests modificados

En watch mode, presiona `o` para correr solo tests de archivos modificados.

### 3. Filtrar tests por nombre

```bash
npm run test:unit -- -t "crear"
```

Corre solo tests que contengan "crear" en el nombre.

### 4. Actualizar snapshots

```bash
npm run test:unit -- -u
```

### 5. Debugging con console.log

En los tests puedes usar `console.log()` normalmente:

```typescript
it('debug test', async () => {
  const resultado = await miFuncion()
  console.log('Resultado:', resultado) // Se muestra en consola
  expect(resultado).toBe(true)
})
```

## 🔧 Solución de Problemas

### "Cannot find module '@/lib/prisma'"

Asegúrate de que `tests/setup/jest.config.js` tiene configurado el `moduleNameMapper`.

### "Prisma Client is not available"

Ejecuta:
```bash
npm run prisma:generate
```

### Tests E2E fallan

1. Verifica que el servidor esté corriendo:
```bash
npm run dev
```

2. Reinstala navegadores:
```bash
npx playwright install
```

### "Database connection failed" en tests de integración

Asegúrate de tener una BD de prueba configurada en `.env.test`.

## 📚 Referencias

- [Jest Docs](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Docs](https://playwright.dev/)
- Ver ejemplos completos en `tests/`

---

**¿Dudas?** Consulta los ejemplos en cada carpeta de tests o revisa `docs/ARCHITECTURE.md`
