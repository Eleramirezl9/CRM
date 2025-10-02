# 📁 Estructura del Proyecto - 100% en Español

## ✅ Estructura Actual (Ya Implementada)

La estructura del proyecto ya está mayormente en español. Aquí está el mapeo completo:

```
CRM/
├── src/
│   ├── app/                                    # ✅ Rutas Next.js
│   │   ├── (autenticacion)/                   # ✅ Grupo de rutas
│   │   │   └── iniciar-sesion/                # ✅ Español
│   │   │       ├── page.tsx
│   │   │       └── ui.tsx
│   │   │
│   │   ├── (principal)/                       # ✅ Grupo de rutas
│   │   │   ├── dashboard/                     # ⚠️ Inglés (común en español)
│   │   │   │   ├── page.tsx
│   │   │   │   ├── productos/                 # ✅ Español
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── productos-lista.tsx
│   │   │   │   │   ├── producto-form.tsx
│   │   │   │   │   ├── nuevo/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── [id]/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── inventario/                # ✅ Español
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── inventario-vista.tsx
│   │   │   │   │   ├── alertas-stock.tsx
│   │   │   │   │   └── movimiento-dialog.tsx
│   │   │   │   │
│   │   │   │   ├── envios/                    # ✅ Español
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── envios-lista.tsx
│   │   │   │   │   ├── sugerencias-envios.tsx
│   │   │   │   │   ├── envio-form.tsx
│   │   │   │   │   └── nuevo/
│   │   │   │   │       └── page.tsx
│   │   │   │   │
│   │   │   │   ├── ventas/                    # ✅ Español
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── ventas-registro.tsx
│   │   │   │   │   ├── ventas-lista.tsx
│   │   │   │   │   └── estadisticas-ventas.tsx
│   │   │   │   │
│   │   │   │   └── reportes/                  # ✅ Español
│   │   │   │       └── page.tsx
│   │   │   │
│   │   │   └── layout.tsx
│   │   │
│   │   ├── api/                               # ✅ Estándar Next.js
│   │   │   └── auth/
│   │   │       └── [...nextauth]/
│   │   │           └── route.ts
│   │   │
│   │   ├── no-autorizado/                     # ✅ Español
│   │   │   └── page.tsx
│   │   │
│   │   ├── globals.css                        # ✅ Estándar
│   │   └── layout.tsx
│   │
│   ├── caracteristicas/                       # ✅ Español (features)
│   │   ├── autenticacion/                     # ✅ Español
│   │   │   ├── auth.ts
│   │   │   └── adapter.ts
│   │   ├── productos/                         # ✅ Español
│   │   │   └── acciones.ts
│   │   ├── inventario/                        # ✅ Español
│   │   │   └── acciones.ts
│   │   ├── envios/                            # ✅ Español
│   │   │   └── acciones.ts
│   │   ├── ventas/                            # ✅ Español
│   │   │   └── acciones.ts
│   │   └── dashboard/                         # ⚠️ Inglés (común)
│   │       └── acciones.ts
│   │
│   └── compartido/                            # ✅ Español (shared)
│       ├── componentes/                       # ✅ Español
│       │   ├── ui/                            # ✅ Estándar
│       │   │   ├── button.tsx
│       │   │   ├── card.tsx
│       │   │   ├── input.tsx
│       │   │   ├── badge.tsx
│       │   │   ├── label.tsx
│       │   │   ├── select.tsx
│       │   │   ├── dialog.tsx
│       │   │   ├── table.tsx
│       │   │   └── tabs.tsx
│       │   │
│       │   └── layout/                        # ✅ Estándar
│       │       └── sidebar.tsx
│       │
│       ├── tipos/                             # ✅ Español (types)
│       │   └── next-auth.d.ts
│       │
│       └── lib/                               # ✅ Estándar
│           └── utils.ts
│
├── lib/                                       # ✅ Estándar Next.js
│   └── prisma.ts
│
├── prisma/                                    # ✅ Estándar
│   ├── schema.prisma
│   └── seed.ts
│
├── middleware.ts                              # ✅ Estándar Next.js
├── package.json
├── tsconfig.json
├── next.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── .gitignore
├── .env.example
└── README.md
```

## 📝 Notas sobre Nomenclatura

### ✅ **Carpetas en Español (Implementadas)**
- `caracteristicas/` → Features/Domain logic
- `compartido/` → Shared code
- `componentes/` → Components
- `tipos/` → Types
- `autenticacion/` → Authentication
- `productos/` → Products
- `inventario/` → Inventory
- `envios/` → Shipments
- `ventas/` → Sales
- `reportes/` → Reports
- `iniciar-sesion/` → Login
- `no-autorizado/` → Unauthorized

### ⚠️ **Términos Aceptados en Inglés**
Estos términos son estándar en la industria y se mantienen en inglés:
- `dashboard` → Ampliamente usado en español
- `app/` → Convención de Next.js
- `api/` → Estándar universal
- `lib/` → Convención de Next.js
- `ui/` → Estándar para componentes de interfaz
- `layout/` → Término técnico estándar

### 📄 **Archivos de Componentes**
Los archivos `.tsx` usan nombres descriptivos en español:
- `productos-lista.tsx` → Lista de productos
- `producto-form.tsx` → Formulario de producto
- `inventario-vista.tsx` → Vista de inventario
- `alertas-stock.tsx` → Alertas de stock
- `movimiento-dialog.tsx` → Diálogo de movimiento
- `envios-lista.tsx` → Lista de envíos
- `sugerencias-envios.tsx` → Sugerencias de envíos
- `ventas-registro.tsx` → Registro de ventas
- `estadisticas-ventas.tsx` → Estadísticas de ventas

## 🎯 Convenciones Aplicadas

1. **Carpetas de dominio**: Siempre en español (`productos/`, `ventas/`, etc.)
2. **Archivos de componentes**: Nombres descriptivos en español con guiones
3. **Archivos técnicos**: Mantienen nombres estándar (`page.tsx`, `layout.tsx`, `route.ts`)
4. **Variables y funciones en código**: En español cuando sea posible
5. **Términos técnicos universales**: Se mantienen en inglés cuando son estándar

## ✨ Ventajas de Esta Estructura

- ✅ **Claridad**: Los nombres en español son más claros para equipos hispanohablantes
- ✅ **Consistencia**: Toda la lógica de negocio usa terminología en español
- ✅ **Estándares**: Respeta las convenciones de Next.js y React
- ✅ **Mantenibilidad**: Fácil de entender y mantener
- ✅ **Escalabilidad**: Estructura modular por dominio

## 🔄 Rutas del Sistema

Todas las rutas están en español:

```
/iniciar-sesion                    → Login
/dashboard                         → Dashboard principal
/dashboard/productos               → Gestión de productos
/dashboard/productos/nuevo         → Crear producto
/dashboard/productos/[id]          → Editar producto
/dashboard/inventario              → Control de inventario
/dashboard/envios                  → Gestión de envíos
/dashboard/envios/nuevo            → Planificar envío
/dashboard/ventas                  → Punto de venta
/dashboard/reportes                → Reportes y gráficos
/no-autorizado                     → Acceso denegado
```

## 🎨 Convención de Nombres de Archivos

```typescript
// ✅ CORRECTO - Nombres descriptivos en español
productos-lista.tsx
producto-form.tsx
ventas-registro.tsx
alertas-stock.tsx
sugerencias-envios.tsx

// ✅ CORRECTO - Archivos estándar de Next.js
page.tsx
layout.tsx
route.ts
middleware.ts

// ✅ CORRECTO - Archivos de configuración
next.config.ts
tailwind.config.ts
tsconfig.json
```

## 📚 Estructura de Código Interno

Dentro de los archivos, también usamos español:

```typescript
// ✅ Funciones en español
export async function obtenerProductos() { }
export async function crearProducto() { }
export async function registrarVenta() { }
export async function obtenerInventario() { }

// ✅ Variables en español
const productos = []
const ventasTotales = 0
const stockCritico = []
const enviosPendientes = []

// ✅ Tipos en español
type Producto = { }
type Venta = { }
type Inventario = { }
```

---

**Conclusión**: El proyecto ya está implementado con una estructura **mayormente en español**, respetando las convenciones estándar de Next.js y React. Los únicos términos en inglés son aquellos que son universalmente aceptados en la industria (como `dashboard`, `api`, `layout`).
