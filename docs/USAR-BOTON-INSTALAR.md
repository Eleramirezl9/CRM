# 🎯 Cómo Usar el Botón de Instalación PWA

## 📱 Componente: InstallButton

**Ubicación:** `src/compartido/componentes/pwa/InstallButton.tsx`

## ✨ Características

✅ **Botón simple que SOLO aparece cuando lo llamas**
✅ **No hay ventanas emergentes automáticas**
✅ **No aparece cada cierto tiempo**
✅ **Funciona en Android, iOS y Desktop**
✅ **Instalación directa en Android (un clic)**
✅ **Instrucciones claras en iOS**

---

## 🚀 Cómo Usarlo

### 1. Importar el Componente

```tsx
import InstallButton from '@/compartido/componentes/pwa/InstallButton'
```

### 2. Colocarlo Donde Quieras

```tsx
export default function MiComponente() {
  return (
    <div>
      <h1>Mi Página</h1>

      {/* El botón aparece aquí */}
      <InstallButton />
    </div>
  )
}
```

---

## 📍 Dónde Colocarlo

### Opción 1: En el Login (Ya configurado)
```tsx
// src/app/(autenticacion)/iniciar-sesion/ui.tsx
<div className="flex justify-center mt-4">
  <InstallButton />
</div>
```

### Opción 2: En el Header/Navbar
```tsx
// src/compartido/componentes/layout/navbar.tsx
<nav>
  <div className="logo">...</div>
  <div className="menu">...</div>
  <InstallButton />
</nav>
```

### Opción 3: En el Dashboard
```tsx
// src/app/(principal)/dashboard/page.tsx
<div className="dashboard">
  <header>
    <h1>Dashboard</h1>
    <InstallButton />
  </header>
  ...
</div>
```

### Opción 4: En el Footer
```tsx
// src/compartido/componentes/layout/footer.tsx
<footer>
  <p>© 2025 Mi App</p>
  <InstallButton />
</footer>
```

---

## 🎨 Personalizar el Botón

El botón usa las clases de Tailwind que especificaste:

```tsx
className="px-4 py-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full text-white text-sm font-semibold shadow-lg"
```

Si quieres cambiar el estilo, edita directamente en `InstallButton.tsx`.

---

## 🔍 Comportamiento por Plataforma

### Android/Chrome/Edge (Desktop y Móvil):
1. Usuario hace clic en "Instalar App"
2. **Aparece prompt nativo del navegador**
3. Usuario confirma → ✅ App instalada

### iOS/Safari:
1. Usuario hace clic en "Instalar App"
2. **Aparece modal con instrucciones paso a paso**
3. Usuario sigue instrucciones → ✅ App instalada

### Desktop sin soporte:
1. Usuario hace clic en "Instalar App"
2. **Aparece modal con instrucciones genéricas**

---

## 🚫 Lo que NO hace

❌ No aparece automáticamente
❌ No hay timers que lo muestren cada X tiempo
❌ No es flotante (no aparece en la esquina)
❌ No interrumpe al usuario
❌ No guarda en localStorage si fue cerrado

---

## ✅ Lo que SÍ hace

✅ Solo aparece donde TÚ lo coloques
✅ Solo actúa cuando el usuario hace clic
✅ Se oculta automáticamente si la app ya está instalada
✅ Funciona en todos los dispositivos modernos

---

## 🧪 Probar en Local

1. Inicia el servidor:
```bash
npm run dev
```

2. Abre http://localhost:3000/iniciar-sesion

3. Verás el botón "Instalar App" debajo del formulario

4. Haz clic y verás:
   - En Chrome: Prompt de instalación nativo
   - En simulador iOS: Modal con instrucciones

---

## 🌐 Probar en Producción

1. Haz deploy:
```bash
npm run build
# Deploy a Vercel/Netlify
```

2. Abre en móvil real

3. El botón funcionará al 100%:
   - **Android**: Instalación con un clic
   - **iOS**: Instrucciones claras

---

## 📝 Notas Importantes

- El botón **solo aparece si la app NO está instalada**
- Una vez instalada, el botón desaparece automáticamente
- No necesitas agregar lógica adicional
- Es plug-and-play: importa y usa

---

## 🎉 Ejemplo Completo

```tsx
'use client'

import InstallButton from '@/compartido/componentes/pwa/InstallButton'

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <h1 className="text-4xl font-bold mb-4">
        Bienvenido a Mi App
      </h1>

      <p className="text-gray-600 mb-8 text-center">
        Instala la app para acceso rápido desde tu pantalla de inicio
      </p>

      {/* El botón aparece aquí */}
      <InstallButton />
    </div>
  )
}
```

---

## 🆘 Solución de Problemas

### El botón no aparece:
- ✅ Verifica que la app NO esté instalada
- ✅ Abre en un navegador moderno (Chrome, Safari, Edge)
- ✅ En producción, verifica que tengas HTTPS

### El botón aparece pero no funciona:
- ✅ Verifica que estés en HTTPS (excepto localhost)
- ✅ Verifica que el manifest.json esté accesible
- ✅ Verifica que los íconos existan en /public/icons/

---

**¡Listo!** Ahora tienes control total de dónde y cuándo aparece el botón de instalación.
