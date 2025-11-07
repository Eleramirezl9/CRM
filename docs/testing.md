# Guía de Testing

## Introducción

Este proyecto implementa una estrategia de testing completa que incluye **tests unitarios**, **tests de integración**, **tests E2E** y **tests de seguridad**.

## Pirámide de Testing

```
        /\
       /  \
      / E2E \
     /________\
    /          \
   / Integración\
  /______________\
 /                \
/    Unitarios     \
/___________________\
```

- **70%**: Tests Unitarios (rápidos, aislados)
- **20%**: Tests de Integración (BD, APIs)
- **10%**: Tests E2E (flujos completos)

## Herramientas

### Jest
- Tests unitarios e integración
- Coverage reports
- Mocks y spies

### Vitest
- Tests de seguridad
- Más rápido que Jest
- Compatible con módulos ESM

### Playwright
- Tests E2E
- Tests cross-browser
- Visual regression

## Estructura de Tests

```
src/
├── caracteristicas/
│   ├── usuarios/
│   │   ├── __tests__/
│   │   │   ├── repositorio.test.ts      # Tests unitarios
│   │   │   └── schemas.test.ts          # Validaciones
│   │   ├── repositorio.ts
│   │   └── schemas.ts
│   │
│   └── autenticacion/
│       └── __tests__/
│           └── auth.integration.test.ts # Tests integración
│
tests/
├── setup/
│   ├── jest.config.js
│   └── playwright.config.ts
│
├── unitarios/                           # Tests unitarios legacy
│   ├── productos/
│   ├── inventario/
│   └── ventas/
│
├── integracion/                         # Tests integración legacy
│   └── inventario/
│
└── e2e/                                 # Tests E2E
    ├── auth.spec.ts
    ├── usuarios.spec.ts
    └── ventas.spec.ts
```

## Tests Unitarios

### Configuración Jest

```javascript
// tests/setup/jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.test.ts', '**/unitarios/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/__tests__/**',
    '!src/**/*.d.ts',
  ],
}
```

### Ejemplo: Test de Repository

```typescript
// src/caracteristicas/usuarios/__tests__/repositorio.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UsuarioRepository } from '../repositorio'

// Mock de Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    usuario: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
    },
  },
}))

// Mock de Argon2
vi.mock('@node-rs/argon2', () => ({
  hash: vi.fn().mockResolvedValue('hashed_password'),
  verify: vi.fn().mockResolvedValue(true),
}))

describe('UsuarioRepository', () => {
  let repository: UsuarioRepository

  beforeEach(() => {
    repository = new UsuarioRepository()
    vi.clearAllMocks()
  })

  describe('create', () => {
    it('debe crear un usuario con contraseña hasheada', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockPrismaCreate = prisma.usuario.create as any

      mockPrismaCreate.mockResolvedValueOnce({
        id: 1,
        nombre: 'Test User',
        correo: 'test@example.com',
        rolId: 1,
        activo: true,
      })

      const usuario = await repository.create({
        nombre: 'Test User',
        correo: 'test@example.com',
        password: 'SecurePassword123!',
        rolId: 1,
      })

      expect(usuario).toBeDefined()
      expect(usuario.nombre).toBe('Test User')
      expect(mockPrismaCreate).toHaveBeenCalled()
    })

    it('debe validar el formato de email', async () => {
      await expect(
        repository.create({
          nombre: 'Test User',
          correo: 'invalid-email',
          password: 'SecurePassword123!',
          rolId: 1,
        })
      ).rejects.toThrow()
    })

    it('debe validar la complejidad de la contraseña', async () => {
      await expect(
        repository.create({
          nombre: 'Test User',
          correo: 'test@example.com',
          password: 'weak',
          rolId: 1,
        })
      ).rejects.toThrow()
    })
  })

  describe('findByEmail', () => {
    it('debe encontrar un usuario por email', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockPrismaFindUnique = prisma.usuario.findUnique as any

      mockPrismaFindUnique.mockResolvedValueOnce({
        id: 1,
        correo: 'test@example.com',
        nombre: 'Test User',
        activo: true,
      })

      const usuario = await repository.findByEmail('test@example.com')
      expect(usuario).toBeDefined()
      expect(usuario?.correo).toBe('test@example.com')
    })

    it('debe normalizar el email (lowercase)', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockPrismaFindUnique = prisma.usuario.findUnique as any

      await repository.findByEmail('TEST@EXAMPLE.COM')

      expect(mockPrismaFindUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { correo: 'test@example.com' },
        })
      )
    })
  })

  describe('incrementFailedAttempts', () => {
    it('debe incrementar intentos fallidos', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockPrismaFindUnique = prisma.usuario.findUnique as any
      const mockPrismaUpdate = prisma.usuario.update as any

      mockPrismaFindUnique.mockResolvedValueOnce({
        id: 1,
        intentosFallidos: 0,
      })

      await repository.incrementFailedAttempts(1)

      expect(mockPrismaUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            intentosFallidos: 1,
          }),
        })
      )
    })

    it('debe bloquear usuario después de 5 intentos', async () => {
      const { prisma } = await import('@/lib/prisma')
      const mockPrismaFindUnique = prisma.usuario.findUnique as any
      const mockPrismaUpdate = prisma.usuario.update as any

      mockPrismaFindUnique.mockResolvedValueOnce({
        id: 1,
        intentosFallidos: 4,
      })

      await repository.incrementFailedAttempts(1)

      expect(mockPrismaUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 1 },
          data: expect.objectContaining({
            intentosFallidos: 5,
            bloqueadoHasta: expect.any(Date),
          }),
        })
      )
    })
  })
})
```

### Ejemplo: Test de Schemas (Zod)

```typescript
// src/caracteristicas/usuarios/__tests__/schemas.test.ts
import { describe, it, expect } from 'vitest'
import {
  emailSchema,
  passwordSchema,
  nombreSchema,
  createUsuarioSchema,
} from '../schemas'

describe('Email Schema Validation', () => {
  it('debería validar emails correctos', () => {
    expect(emailSchema.parse('usuario@empresa.com')).toBe('usuario@empresa.com')
  })

  it('debería normalizar emails (lowercase, trim)', () => {
    const result = emailSchema.parse('  USUARIO@EMPRESA.COM  ')
    expect(result).toBe('usuario@empresa.com')
  })

  it('debería rechazar emails inválidos', () => {
    expect(() => emailSchema.parse('invalid-email')).toThrow('Email inválido')
  })

  it('debería rechazar emails demasiado largos', () => {
    const longEmail = 'a'.repeat(250) + '@test.com'
    expect(() => emailSchema.parse(longEmail)).toThrow()
  })
})

describe('Password Schema - Seguridad', () => {
  it('debería validar contraseñas seguras', () => {
    expect(passwordSchema.parse('SecurePass123!')).toBe('SecurePass123!')
  })

  it('debería rechazar contraseñas sin minúsculas', () => {
    expect(() => passwordSchema.parse('NOMIN123!')).toThrow('minúsculas')
  })

  it('debería rechazar contraseñas sin mayúsculas', () => {
    expect(() => passwordSchema.parse('nomaj123!')).toThrow('mayúsculas')
  })

  it('debería rechazar contraseñas sin números', () => {
    expect(() => passwordSchema.parse('NoNumbers!')).toThrow('números')
  })

  it('debería rechazar contraseñas sin caracteres especiales', () => {
    expect(() => passwordSchema.parse('NoSpecial123')).toThrow('caracteres especiales')
  })

  it('debería rechazar contraseñas demasiado cortas', () => {
    expect(() => passwordSchema.parse('Sh0rt!')).toThrow('Mínimo 8')
  })

  it('debería rechazar contraseñas demasiado largas (prevención DoS)', () => {
    const longPassword = 'A1!' + 'a'.repeat(200)
    expect(() => passwordSchema.parse(longPassword)).toThrow()
  })
})

describe('Create Usuario Schema - Prevención Injection', () => {
  it('debería validar datos correctos', () => {
    const data = {
      nombre: 'Juan Pérez',
      correo: 'juan@empresa.com',
      password: 'Secure123!',
      rolId: 1,
    }

    const result = createUsuarioSchema.parse(data)
    expect(result.correo).toBe('juan@empresa.com')
  })

  it('debería rechazar rolId inválido (prevención SQL Injection)', () => {
    const data = {
      nombre: 'Test',
      correo: 'test@test.com',
      password: 'Secure123!',
      rolId: "1 OR 1=1" as any,
    }

    expect(() => createUsuarioSchema.parse(data)).toThrow()
  })
})
```

### Comandos

```bash
# Ejecutar tests unitarios
npm run test:unit

# Modo watch (desarrollo)
npm run test:unit:watch

# Con coverage
npm run test:coverage
```

## Tests de Integración

Los tests de integración prueban múltiples componentes trabajando juntos, incluyendo la base de datos.

### Configuración

```typescript
// tests/setup/test-db.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL_TEST,
    },
  },
})

export async function setupTestDB() {
  // Limpiar base de datos
  await prisma.usuario.deleteMany()
  await prisma.role.deleteMany()
  // ... más limpieza
}

export async function teardownTestDB() {
  await prisma.$disconnect()
}
```

### Ejemplo: Test de Autenticación

```typescript
// src/caracteristicas/autenticacion/__tests__/auth.integration.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { setupTestDB, teardownTestDB } from '@/tests/setup/test-db'

describe('Autenticación - Tests de Integración', () => {
  beforeAll(async () => {
    await setupTestDB()
  })

  afterAll(async () => {
    await teardownTestDB()
  })

  describe('Flujo de Login', () => {
    it('debe permitir login con credenciales válidas', async () => {
      // Crear usuario de prueba
      const usuario = await prisma.usuario.create({
        data: {
          nombre: 'Test User',
          correo: 'test@test.com',
          contrasenaHash: await hash('Password123!'),
          rolId: 1,
          activo: true,
        },
      })

      // Intentar login
      const result = await signIn('credentials', {
        correo: 'test@test.com',
        password: 'Password123!',
        redirect: false,
      })

      expect(result.ok).toBe(true)
      expect(result.error).toBeNull()
    })

    it('debe rechazar login con contraseña incorrecta', async () => {
      const result = await signIn('credentials', {
        correo: 'test@test.com',
        password: 'WrongPassword',
        redirect: false,
      })

      expect(result.ok).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('debe rechazar login de usuario inactivo', async () => {
      // Desactivar usuario
      await prisma.usuario.update({
        where: { correo: 'test@test.com' },
        data: { activo: false },
      })

      const result = await signIn('credentials', {
        correo: 'test@test.com',
        password: 'Password123!',
        redirect: false,
      })

      expect(result.ok).toBe(false)
      expect(result.error).toContain('inactivo')
    })
  })

  describe('Rate Limiting', () => {
    it('debe bloquear después de 5 intentos fallidos', async () => {
      const email = 'ratelimit@test.com'

      // 5 intentos fallidos
      for (let i = 0; i < 5; i++) {
        await signIn('credentials', {
          correo: email,
          password: 'WrongPassword',
          redirect: false,
        })
      }

      // Sexto intento debe ser bloqueado
      const result = await signIn('credentials', {
        correo: email,
        password: 'WrongPassword',
        redirect: false,
      })

      expect(result.error).toContain('Demasiados intentos')
    })
  })

  describe('Auditoría', () => {
    it('debe registrar login exitoso en audit log', async () => {
      await signIn('credentials', {
        correo: 'test@test.com',
        password: 'Password123!',
        redirect: false,
      })

      const logs = await prisma.auditLog.findMany({
        where: { accion: 'LOGIN' },
      })

      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].exitoso).toBe(true)
    })

    it('debe registrar login fallido en audit log', async () => {
      await signIn('credentials', {
        correo: 'test@test.com',
        password: 'WrongPassword',
        redirect: false,
      })

      const logs = await prisma.auditLog.findMany({
        where: { accion: 'LOGIN_FAILED' },
      })

      expect(logs.length).toBeGreaterThan(0)
      expect(logs[0].exitoso).toBe(false)
    })
  })
})
```

### Comandos

```bash
# Ejecutar tests de integración
npm run test:integration

# Todos los tests (unit + integration)
npm run test
```

## Tests E2E (End-to-End)

Los tests E2E prueban flujos completos desde la perspectiva del usuario.

### Configuración Playwright

```typescript
// tests/setup/playwright.config.ts
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '../e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
  ],
})
```

### Ejemplo: Test de Login

```typescript
// tests/e2e/auth.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Autenticación', () => {
  test('debe permitir login exitoso', async ({ page }) => {
    // Ir a la página de login
    await page.goto('/iniciar-sesion')

    // Llenar formulario
    await page.fill('input[name="correo"]', 'admin@empresa.com')
    await page.fill('input[name="password"]', 'Admin@2025')

    // Hacer clic en iniciar sesión
    await page.click('button[type="submit"]')

    // Verificar redirección al dashboard
    await expect(page).toHaveURL('/dashboard')

    // Verificar que se muestra el nombre del usuario
    await expect(page.locator('text=Administrador Principal')).toBeVisible()
  })

  test('debe mostrar error con credenciales incorrectas', async ({ page }) => {
    await page.goto('/iniciar-sesion')

    await page.fill('input[name="correo"]', 'admin@empresa.com')
    await page.fill('input[name="password"]', 'PasswordIncorrecto')

    await page.click('button[type="submit"]')

    // Verificar mensaje de error
    await expect(page.locator('text=/credenciales.*incorrectas/i')).toBeVisible()

    // Verificar que sigue en la página de login
    await expect(page).toHaveURL('/iniciar-sesion')
  })

  test('debe bloquear después de 5 intentos fallidos', async ({ page }) => {
    await page.goto('/iniciar-sesion')

    // 5 intentos fallidos
    for (let i = 0; i < 5; i++) {
      await page.fill('input[name="correo"]', 'test@test.com')
      await page.fill('input[name="password"]', 'WrongPassword')
      await page.click('button[type="submit"]')
      await page.waitForTimeout(500)
    }

    // Verificar mensaje de bloqueo
    await expect(page.locator('text=/demasiados intentos/i')).toBeVisible()
  })
})
```

### Ejemplo: Test de Gestión de Usuarios

```typescript
// tests/e2e/usuarios.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Gestión de Usuarios', () => {
  test.beforeEach(async ({ page }) => {
    // Login como administrador
    await page.goto('/iniciar-sesion')
    await page.fill('input[name="correo"]', 'admin@empresa.com')
    await page.fill('input[name="password"]', 'Admin@2025')
    await page.click('button[type="submit"]')
    await page.waitForURL('/dashboard')
  })

  test('debe crear un nuevo usuario', async ({ page }) => {
    // Ir a usuarios
    await page.click('a[href="/dashboard/usuarios"]')

    // Hacer clic en "Nuevo Usuario"
    await page.click('text=Nuevo Usuario')

    // Llenar formulario
    await page.fill('input[name="nombre"]', 'Usuario Test')
    await page.fill('input[name="correo"]', 'nuevo@test.com')
    await page.fill('input[name="password"]', 'Test@2025')
    await page.selectOption('select[name="rolId"]', { label: 'Bodega' })

    // Guardar
    await page.click('button[type="submit"]')

    // Verificar redirección y mensaje
    await expect(page).toHaveURL('/dashboard/usuarios')
    await expect(page.locator('text=Usuario creado exitosamente')).toBeVisible()

    // Verificar que aparece en la lista
    await expect(page.locator('text=Usuario Test')).toBeVisible()
  })

  test('debe desactivar un usuario', async ({ page }) => {
    await page.goto('/dashboard/usuarios')

    // Buscar usuario y hacer clic en desactivar
    const row = page.locator('tr:has-text("Usuario Test")')
    await row.locator('button[aria-label="Desactivar"]').click()

    // Confirmar
    await page.click('button:has-text("Desactivar")')

    // Verificar que cambió el estado
    await expect(row.locator('text=Inactivo')).toBeVisible()
  })
})
```

### Comandos

```bash
# Ejecutar tests E2E
npm run test:e2e

# Con UI interactiva
npm run test:e2e:ui

# Con navegador visible
npm run test:e2e:headed
```

## Tests de Seguridad

Tests específicos para verificar vulnerabilidades.

### Ejemplo: Test de XSS

```typescript
describe('Prevención XSS', () => {
  it('debe sanitizar nombres con scripts', () => {
    const maliciousName = '<script>alert("XSS")</script>'

    expect(() => nombreSchema.parse(maliciousName)).toThrow()
  })

  it('debe rechazar HTML en nombres', () => {
    const htmlName = '<b>Bold Name</b>'

    expect(() => nombreSchema.parse(htmlName)).toThrow()
  })
})
```

### Ejemplo: Test de SQL Injection

```typescript
describe('Prevención SQL Injection', () => {
  it('debe rechazar intentos de SQL Injection en email', () => {
    const maliciousEmail = "admin@empresa.com' OR '1'='1"

    expect(() => emailSchema.parse(maliciousEmail)).toThrow()
  })

  it('debe validar tipos en IDs', () => {
    const maliciousId = "1 OR 1=1"

    expect(() =>
      createUsuarioSchema.parse({
        nombre: 'Test',
        correo: 'test@test.com',
        password: 'Test@123',
        rolId: maliciousId as any,
      })
    ).toThrow()
  })
})
```

### Comandos

```bash
# Ejecutar tests de seguridad
npm run test:security

# Modo watch
npm run test:security:watch
```

## Coverage

### Generar Reporte

```bash
npm run test:coverage
```

### Objetivos de Coverage

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

### Ejemplo de Reporte

```
--------------------|---------|----------|---------|---------|
File                | % Stmts | % Branch | % Funcs | % Lines |
--------------------|---------|----------|---------|---------|
All files           |   85.23 |    78.45 |   82.15 |   85.67 |
 usuarios/          |   92.50 |    85.30 |   90.00 |   92.80 |
  repositorio.ts    |   95.20 |    88.90 |   92.50 |   95.50 |
  schemas.ts        |   89.80 |    81.70 |   87.50 |   90.10 |
 autenticacion/     |   88.60 |    82.10 |   85.70 |   89.20 |
  auth.ts           |   90.40 |    84.20 |   87.30 |   91.10 |
--------------------|---------|----------|---------|---------|
```

## CI/CD

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:unit

      - name: Run integration tests
        run: npm run test:integration
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL_TEST }}

      - name: Run security tests
        run: npm run test:security

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Mejores Prácticas

### 1. AAA Pattern (Arrange-Act-Assert)

```typescript
it('debe crear un usuario', async () => {
  // Arrange (Preparar)
  const data = {
    nombre: 'Test',
    correo: 'test@test.com',
    password: 'Test@123',
    rolId: 1,
  }

  // Act (Actuar)
  const usuario = await repository.create(data)

  // Assert (Verificar)
  expect(usuario.nombre).toBe('Test')
})
```

### 2. Tests Descriptivos

```typescript
// ✅ Bueno
it('debe incrementar intentos fallidos después de login incorrecto', ...)

// ❌ Malo
it('test login', ...)
```

### 3. Un Assert por Test

```typescript
// ✅ Bueno
it('debe normalizar email a lowercase', () => {
  expect(emailSchema.parse('TEST@TEST.COM')).toBe('test@test.com')
})

// ❌ Malo (múltiples asserts no relacionados)
it('debe validar usuario', () => {
  expect(usuario.nombre).toBe('Test')
  expect(usuario.email).toContain('@')
  expect(usuario.activo).toBe(true)
  expect(usuario.rolId).toBeGreaterThan(0)
})
```

### 4. Limpiar Después de Tests

```typescript
afterEach(async () => {
  await prisma.usuario.deleteMany()
  vi.clearAllMocks()
})
```

### 5. Evitar Tests Dependientes

```typescript
// ❌ Malo (test depende del anterior)
it('debe crear usuario', async () => {
  globalUser = await createUser()
})

it('debe actualizar usuario', async () => {
  await updateUser(globalUser.id) // Depende del test anterior
})

// ✅ Bueno (cada test es independiente)
it('debe actualizar usuario', async () => {
  const user = await createUser()
  await updateUser(user.id)
})
```

## Debugging

### Debug con VS Code

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Jest Debug",
      "program": "${workspaceFolder}/node_modules/.bin/jest",
      "args": ["--runInBand", "${file}"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

### Debug con Playwright

```bash
# Ejecutar con inspector
npx playwright test --debug

# Ejecutar test específico con inspector
npx playwright test auth.spec.ts --debug
```

## Recursos

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)

---

**Última actualización**: 2025-11-06
