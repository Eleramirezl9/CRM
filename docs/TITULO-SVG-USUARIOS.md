# 🎨 Títulos SVG - Gestión de Usuarios

## Opciones Disponibles

Hemos creado dos versiones hermosas del título "Gestión de Usuarios" con SVG. Puedes usar cualquiera de ellas cambiando el componente en `page.tsx`.

---

## 📋 Versión 1: Clásica y Limpia (Actual)

**Componente:** `UsuariosPageTitle.tsx`

```tsx
import { UsuariosPageTitle } from './UsuariosPageTitle'

// En el JSX:
<UsuariosPageTitle />
```

**Características:**
- ✅ Icon SVG con 3 usuarios
- ✅ Título con gradiente azul
- ✅ Línea decorativa bajo el título
- ✅ Responsive (ajusta tamaño en móvil/desktop)
- ✅ Minimalista y profesional

**Aspecto:**
```
[SVG Icon] Gestión de Usuarios
           ───────────────────
```

---

## 🎯 Versión 2: Moderna y Destacada

**Componente:** `UsuariosPageTitleV2.tsx`

```tsx
import { UsuariosPageTitleV2 } from './UsuariosPageTitleV2'

// En el JSX:
<UsuariosPageTitleV2 />
```

**Características:**
- ✅ Badge SVG con gradiente de fondo
- ✅ Título dividido en 2 líneas
- ✅ "Usuarios" con gradiente colorido
- ✅ Líneas decorativas progresivas
- ✅ Más impactante y moderna

**Aspecto:**
```
[SVG Badge]  Gestión de
             Usuarios (con gradiente)
             ─ ─ ─ (líneas decorativas)
```

---

## 🔄 Cómo Cambiar Entre Versiones

### Cambiar a Versión 2:

1. Abre `src/app/(principal)/dashboard/usuarios/page.tsx`

2. Cambia el import:
```tsx
// De:
import { UsuariosPageTitle } from './UsuariosPageTitle'

// A:
import { UsuariosPageTitleV2 } from './UsuariosPageTitleV2'
```

3. Cambia el componente en el JSX:
```tsx
// De:
<UsuariosPageTitle />

// A:
<UsuariosPageTitleV2 />
```

4. ¡Listo! Guarda y recarga la página

---

## 🎨 Personalización

### Cambiar Colores

En cualquiera de los archivos, busca `text-blue-600` y cámbialo por:

```css
text-slate-700      /* Gris oscuro */
text-slate-900      /* Negro suave */
text-indigo-600     /* Índigo */
text-violet-600     /* Violeta */
text-emerald-600    /* Verde */
text-orange-600     /* Naranja */
```

### Cambiar Tamaño del SVG

Cambia `width` y `height` en el SVG:

```tsx
// Pequeño (actual)
<svg width="40" height="40" ... />

// Grande
<svg width="56" height="56" ... />

// Extra grande
<svg width="64" height="64" ... />
```

### Cambiar Tamaño del Texto

Ajusta las clases de Tailwind:

```tsx
// Pequeño
<h1 className="text-xl sm:text-2xl lg:text-3xl ...">

// Mediano (actual)
<h1 className="text-2xl sm:text-3xl lg:text-4xl ...">

// Grande
<h1 className="text-3xl sm:text-4xl lg:text-5xl ...">
```

---

## 📱 Responsivo

Ambas versiones son completamente responsivas:

- **Móvil (< 640px)**: Texto pequeño, SVG compacto
- **Tablet (640px - 1024px)**: Tamaño mediano
- **Desktop (> 1024px)**: Tamaño grande y espacioso

---

## 🎯 Recomendaciones

### Usa Versión 1 si:
- Prefieres un diseño limpio y minimalista
- Quieres algo que no sea muy llamativo
- Necesitas compatibilidad con otros temas

### Usa Versión 2 si:
- Quieres un diseño más moderno e impactante
- Necesitas que el título sea más destacado
- Prefieres un estilo más profesional y elegante

---

## 💡 Tips

1. **Combina con el tema**: Los colores azules están diseñados para el sistema, pero puedes cambiarlos
2. **Mantén consistencia**: Usa el mismo color en toda la página
3. **Prueba en móvil**: Asegúrate de que se vea bien en todos los dispositivos
4. **Vacía caché**: Si no ves cambios, limpia caché del navegador (Ctrl+Shift+R)

---

## 📝 Ubicación de Archivos

```
src/app/(principal)/dashboard/usuarios/
├── page.tsx                      ← Archivo principal
├── UsuariosPageTitle.tsx         ← Versión 1
├── UsuariosPageTitleV2.tsx       ← Versión 2
└── (otros componentes)
```

---

**Versión:** 1.0
**Fecha:** Noviembre 2025
**Estado:** ✅ Completado
