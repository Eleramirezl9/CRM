# 🧪 Estrategia de Testing - CRM Multi-Sucursal

## 📋 Estructura de Tests

```
tests/
├── unitarios/              # Tests de funciones aisladas
│   ├── productos/
│   ├── inventario/
│   ├── ventas/
│   └── envios/
│
├── integracion/            # Tests de flujos completos con BD
│   ├── productos/
│   ├── inventario/
│   ├── ventas/
│   └── envios/
│
├── e2e/                    # Tests End-to-End (usuario completo)
│   ├── autenticacion/
│   ├── flujos-ventas/
│   ├── flujos-inventario/
│   └── flujos-envios/
│
└── setup/                  # Configuración de tests
    ├── jest.config.js
    ├── jest.setup.js
    ├── playwright.config.ts
    └── mocks/
        ├── prisma.ts
        └── datos-prueba.ts
```

## 🎯 Tipos de Tests

### 1. Tests Unitarios (60%)
- Server Actions aisladas
- Funciones de utilidad
- Validaciones

### 2. Tests de Integración (30%)
- Server Actions + BD
- Transacciones completas

### 3. Tests E2E (10%)
- Flujos de usuario completos
- Casos críticos

## 🚀 Comandos

```bash
npm run test:unit              # Tests unitarios
npm run test:integration       # Tests de integración
npm run test:e2e               # Tests E2E
npm run test                   # Todos los tests
npm run test:coverage          # Reporte de cobertura
```
