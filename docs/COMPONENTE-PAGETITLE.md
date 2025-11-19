# 🎨 Componente PageTitle - Títulos Reutilizables para Todos los Módulos

## 📋 Descripción

Se ha creado un componente `PageTitle` reutilizable que proporciona títulos profesionales con SVG personalizados para cada módulo del sistema.

**Ubicación:** `src/compartido/componentes/PageTitle.tsx`

---

## 🚀 Cómo Usarlo

### Importar el componente:

```tsx
import { PageTitle } from '@/compartido/componentes/PageTitle'
```

### Uso básico:

```tsx
<PageTitle title="Gestión de Usuarios" icon="usuarios" />
```

### Con opciones:

```tsx
<PageTitle 
  title="Tu Título Aquí"
  icon="dashboard"
  showUnderline={true}
/>
```

---

## 🎯 Iconos Disponibles

| Icon | Módulo | Uso |
|------|--------|-----|
| `usuarios` | Gestión de Usuarios |👥 Icono de grupo de usuarios |
| `roles` | Gestión de Roles | 👤👤👤 Tres usuarios |
| `productos` | Productos | 📊 Barras de productos |
| `inventario` | Inventario | 📦 Almacén |
| `ventas` | Ventas | 📈 Gráfico de ventas |
| `envios` | Envíos | 📦 Caja de envío |
| `sucursales` | Sucursales | 🏢 Edificio |
| `dashboard` | Dashboard | 📋 Grid de cuadrículas |
| `reportes` | Reportes | 📄 Documento |

---

## 📝 Props

```typescript
interface PageTitleProps {
  title: string              // Título a mostrar (requerido)
  icon?: 'usuarios' | 'roles' | 'productos' | 'inventario' | 'ventas' | 'envios' | 'sucursales' | 'dashboard' | 'reportes'
  showUnderline?: boolean    // Mostrar línea decorativa (default: true)
}
```

---

## 💡 Ejemplos de Uso

### Dashboard
```tsx
import { PageTitle } from '@/compartido/componentes/PageTitle'

export default function DashboardPage() {
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <PageTitle title="Dashboard" icon="dashboard" />
      {/* contenido */}
    </div>
  )
}
```

### Gestión de Roles
```tsx
import { PageTitle } from '@/compartido/componentes/PageTitle'

export default function RolesPage() {
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <PageTitle title="Gestión de Roles" icon="roles" />
      {/* contenido */}
    </div>
  )
}
```

### Productos
```tsx
import { PageTitle } from '@/compartido/componentes/PageTitle'

export default function ProductosPage() {
  return (
    <div className="p-4 sm:p-8 space-y-6">
      <PageTitle title="Gestión de Productos" icon="productos" />
      {/* contenido */}
    </div>
  )
}
```

---

## 🎨 Características

- ✅ **Reutilizable**: Un componente para todos los módulos
- ✅ **Responsive**: Se adapta a móvil, tablet y desktop
- ✅ **Minimalista**: Diseño limpio y profesional
- ✅ **SVG Personalizado**: Cada módulo tiene su propio icono
- ✅ **Color Negro**: Consistente con el sistema
- ✅ **Línea Decorativa**: Opcional, por defecto activada
- ✅ **Sin Dependencias**: Solo usa componentes nativos

---

## 🔧 Personalización

### Cambiar tamaño del SVG:

En el componente, busca `width="40" height="40"` y cámbialo:

```tsx
// Pequeño
<svg width="32" height="32" ... />

// Mediano (actual)
<svg width="40" height="40" ... />

// Grande
<svg width="48" height="48" ... />
```

### Ocultar línea decorativa:

```tsx
<PageTitle title="Mi Título" icon="usuarios" showUnderline={false} />
```

### Cambiar color:

Busca `text-slate-900` en el componente y cámbialo por cualquier color de Tailwind.

---

## 📋 Módulos para Actualizar

Estos son los archivos que deberían usar el componente `PageTitle`:

```
src/app/(principal)/dashboard/
├── page.tsx                          ← Dashboard
├── usuarios/page.tsx                 ← Gestión de Usuarios
├── roles/page.tsx                    ← Gestión de Roles
├── productos/page.tsx                ← Gestión de Productos
├── inventario/page.tsx               ← Control de Inventario
├── ventas/page.tsx                   ← Ventas
├── envios/page.tsx                   ← Gestión de Envíos
├── sucursales/page.tsx               ← Gestión de Sucursales
└── reportes/page.tsx                 ← Reportes
```

---

## 🔄 Migración

Para migrar un módulo existente:

### 1. Importar el componente:
```tsx
import { PageTitle } from '@/compartido/componentes/PageTitle'
```

### 2. Reemplazar el título antiguo:
```tsx
// De:
<h1 className="text-3xl font-bold">Gestión de Usuarios</h1>

// A:
<PageTitle title="Gestión de Usuarios" icon="usuarios" />
```

### 3. Ajustar espaciado si es necesario:
El componente devuelve un `mb-2`, así que puede que necesites ajustar el `space-y-6` del contenedor.

---

## ✅ Beneficios

1. **Consistencia**: Todos los títulos tienen el mismo look & feel
2. **Mantenibilidad**: Cambios centralizados
3. **Flexibilidad**: Fácil personalizar por módulo
4. **Escalabilidad**: Agregar nuevos módulos es trivial
5. **Performance**: Un componente shared en lugar de muchos duplicados

---

## 📚 Próximos Pasos

1. Actualizar todos los módulos para usar `PageTitle`
2. Considerar agregar más variantes de iconos
3. Agregar animaciones opcionales
4. Implementar modo oscuro si es necesario

---

**Versión:** 1.0
**Fecha:** Noviembre 2025
**Estado:** ✅ Completado
