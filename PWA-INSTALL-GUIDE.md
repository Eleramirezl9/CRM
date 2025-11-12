# Guía de Instalación PWA - CRM Sistema

## 📱 ¿Por qué no aparece el botón de instalación en mi celular?

El componente InstallPWA ha sido mejorado para manejar múltiples escenarios. Aquí está lo que debes saber:

---

## ✅ Cómo aparecerá la notificación

### En **Android** con Chrome/Edge/Brave:
- ✅ Verás una tarjeta flotante en la esquina inferior derecha
- ✅ Botón "Instalar ahora" funcional
- ✅ Aparecerá automáticamente después de 2 segundos

### En **iOS** con Safari:
- ⚠️ iOS no soporta `beforeinstallprompt` nativamente
- ✅ Se mostrará una tarjeta con **instrucciones paso a paso**:
  1. Toca el menú (↑) en la parte inferior
  2. Selecciona "Añadir a Inicio"

---

## 🔧 ¿Qué hace el componente mejorado?

```
┌─────────────────────────────────────────┐
│  1. Detecta si ya está instalada        │ → Si sí, no muestra nada
├─────────────────────────────────────────┤
│  2. Detecta el tipo de dispositivo       │ → Android, iOS, o Desktop
├─────────────────────────────────────────┤
│  3. Intenta capturar beforeinstallprompt │ → Si no funciona en 3 seg...
├─────────────────────────────────────────┤
│  4. Muestra fallback según dispositivo   │ → Android: botón | iOS: guía
└─────────────────────────────────────────┘
```

---

## 🐛 Si NO aparece en tu celular:

### **Android:**
1. Abre `https://crm-multi-sucursal.vercel.app/iniciar-sesion`
2. Espera 3-4 segundos
3. Abre la **consola del navegador** (F12 → Console)
4. Busca mensajes:
   - ✅ `✅ beforeinstallprompt event capturado correctamente` → Normal ✓
   - ⚠️ `⚠️ No se capturó beforeinstallprompt...` → Fallback activado ✓

### **iOS:**
1. Abre Safari
2. Espera 3-4 segundos
3. Deberías ver instrucciones paso a paso
4. Si no aparece, verifica:
   - Safari está actualizado
   - PWA tiene `manifest.json` válido ✓ (ya configurado)

---

## 🚀 Lo que hace cada parte del código:

### Detección automática:
```typescript
// Detecta si es iPhone, iPad o iPad
const ios = /iphone|ipad|ipod/.test(userAgent)

// Detecta si es cualquier Android/móvil
const mobile = /android|webos|iphone|ipad|ipot|blackberry|iemobile|opera mini/.test(userAgent)
```

### Sistema de fallback (3 segundos):
```typescript
// Si en 3 segundos no captura beforeinstallprompt pero es móvil
const fallbackTimer = setTimeout(() => {
  if (!hasNativeSupport && isMobile && !isInstalled) {
    setShowInstall(true) // Mostrar prompt manual
  }
}, 3000)
```

### Diferentes interfaces por dispositivo:
- **Android**: Botón de instalación nativa
- **iOS**: Guía de 2 pasos con iconos azules
- **Desktop**: No muestra nada (no es móvil)

---

## 📍 Dónde aparecerá en tu sitio

La tarjeta PWA aparecerá en la página de login:
- **URL**: `https://crm-multi-sucursal.vercel.app/iniciar-sesion`
- **Posición**: Esquina inferior derecha (fixed)
- **Z-index**: 50 (sobre otros elementos)

---

## 🎯 Requisitos para PWA

✅ **Ya están configurados:**
- `manifest.json` en `/public` con iconos
- Service Worker activado en `next.config.js`
- HTTPS en producción (Vercel)
- Soporte offline configurado

---

## 💡 Pasos de usuario final

### Android:
```
1. Abre la página en Chrome/Edge
2. Ve la tarjeta flotante
3. Haz clic en "Instalar ahora"
4. Confirma en el diálogo del navegador
5. ¡Listo! La app aparecerá en tu pantalla de inicio
```

### iOS:
```
1. Abre la página en Safari
2. Lee las instrucciones de la tarjeta
3. Toca el botón compartir (↑) abajo
4. Selecciona "Añadir a Inicio"
5. ¡Listo! La app aparecerá en tu pantalla de inicio
```

---

## 🔍 Debugging

### Ver logs en consola:
```javascript
// En DevTools (F12 → Console)

// Cuando se captura el evento
✅ beforeinstallprompt event capturado correctamente

// Cuando se muestra fallback
⚠️ No se capturó beforeinstallprompt, mostrando instrucciones manuales

// Cuando el usuario instala
✅ Usuario aceptó la instalación

// Cuando ya está instalada
✅ App instalada exitosamente
```

---

## 📊 Estados posibles

| Escenario | Qué pasa |
|-----------|---------|
| Android + beforeinstallprompt ✅ | Botón de instalar |
| Android + sin beforeinstallprompt | Fallback después de 3s |
| iOS en Safari | Guía paso a paso |
| iOS en Chrome | Sin soporte (use Safari) |
| Desktop | No muestra nada |
| Ya instalada | No muestra nada |
| Rechazada hace <7 días | No muestra nada (hasta 7 días) |

---

## ⚙️ Si necesitas resetear

Si el usuario rechazó hace poco y quieres que reaparezca:

```javascript
// En consola del navegador
localStorage.removeItem('pwa-dismissed')
location.reload()
```

---

## 🎨 Personalización

El componente tiene dos variantes:

```tsx
// Flotante (actual - esquina inferior derecha)
<InstallPWA variant="floating" />

// Inline (integrada en contenido)
<InstallPWA variant="inline" />
```

---

**Última actualización:** 11 de noviembre de 2025
**Versión componente:** 2.0 (Mejorado con fallback)
