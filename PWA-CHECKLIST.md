# ✅ Checklist - Instalación PWA

## Verificación de Configuración

Este documento te ayuda a verificar que la PWA está correctamente configurada.

---

## 1️⃣ **Verificación básica**

- [ ] **Archivo `manifest.json` existe** en `/public/manifest.json`
  ```bash
  # Verifica en tu navegador:
  # https://crm-multi-sucursal.vercel.app/manifest.json
  ```

- [ ] **Service Worker registrado** en `next.config.js`
  ```javascript
  // Debe tener: const withPWA = require('next-pwa')({...})
  ```

- [ ] **HTTPS activo** (requerido para PWA)
  ```
  ✅ Vercel usa HTTPS automáticamente
  ```

---

## 2️⃣ **Verificación en el navegador (F12)**

### Abrir DevTools
- Windows/Linux: `F12`
- Mac: `Cmd + Option + I`

### Ir a "Application" tab
- [ ] **Manifest** - Debe mostrar el contenido del manifest.json
- [ ] **Service Workers** - Debe mostrar "Activo" o "Waiting"
- [ ] **Storage** - localStorage debe estar disponible

### Ver logs en Console
Pega este código en la consola:

```javascript
// Verificar PWA
console.log('🔍 PWA Check:');
console.log('HTTPS:', location.protocol === 'https:' ? '✅' : '❌');
console.log('Service Worker:', 'serviceWorker' in navigator ? '✅' : '❌');
console.log('Manifest:', document.querySelector('link[rel="manifest"]') ? '✅' : '❌');

// Verificar beforeinstallprompt
window.addEventListener('beforeinstallprompt', () => {
  console.log('✅ beforeinstallprompt capturado correctamente');
});
```

---

## 3️⃣ **Verificación en DESKTOP** (para testing)

Aunque PWA es para móvil, puedes testear en desktop:

### Chrome/Edge (Windows/Linux/Mac):
1. Abre DevTools (F12)
2. Presiona `Ctrl+Shift+P` (o `Cmd+Shift+P` en Mac)
3. Busca: `Emulate a focused web and app-capable device`
4. Selecciona un dispositivo (ej: iPhone 12, Pixel 5)
5. Deberías ver la tarjeta de instalación

---

## 4️⃣ **Verificación en MÓVIL REAL**

### En Android:
1. [ ] Abre Chrome en tu celular
2. [ ] Ve a `https://crm-multi-sucursal.vercel.app/iniciar-sesion`
3. [ ] **Espera 2-3 segundos**
4. [ ] ¿Ves una tarjeta flotante en la esquina inferior derecha?
   - SÍ ✅ → Haz clic en "Instalar ahora"
   - NO ⚠️ → Ver sección "Solución de problemas"

### En iOS:
1. [ ] Abre Safari en tu iPhone/iPad
2. [ ] Ve a `https://crm-multi-sucursal.vercel.app/iniciar-sesion`
3. [ ] **Espera 2-3 segundos**
4. [ ] ¿Ves una tarjeta flotante con instrucciones?
   - SÍ ✅ → Sigue las instrucciones (Compartir → Añadir a Inicio)
   - NO ⚠️ → Ver sección "Solución de problemas"

---

## 5️⃣ **Verificación de instalación exitosa**

Una vez instalada la app:

- [ ] La app tiene su propio ícono en pantalla de inicio
- [ ] Al abrirla, NO muestra barra de direcciones del navegador
- [ ] Dice "display-mode: standalone" en DevTools → Application
- [ ] Al refrescar, NO es necesario que reaparezca el prompt
- [ ] La app funciona sin conexión a internet (contenido cacheado)

---

## 🐛 **Solución de problemas**

### ❌ No aparece el botón de instalación

**Causas posibles:**

1. **No es un dispositivo móvil**
   - El prompt solo aparece en móviles (Android/iOS)
   - En desktop, aparecerá solo en modo Device Emulation

2. **El navegador no soporta PWA**
   - ✅ Chrome: SÍ
   - ✅ Edge: SÍ
   - ✅ Samsung Internet: SÍ
   - ✅ Safari (iOS): SÍ (pero diferente)
   - ❌ Firefox: NO completamente
   - ❌ Opera Mini: NO

3. **Ya fue rechazada**
   - El sistema espera 7 días antes de mostrar nuevamente
   - Para resetear:
     ```javascript
     // En consola:
     localStorage.removeItem('pwa-dismissed')
     location.reload()
     ```

4. **El manifest.json no está accesible**
   - Verifica: `https://crm-multi-sucursal.vercel.app/manifest.json`
   - Debe devolver JSON válido (no 404)

5. **No hay Service Worker activo**
   - En DevTools → Application → Service Workers
   - Debe mostrar un estado "Activo"
   - Si dice "Espera", recarga la página

---

### ✅ Soluciones rápidas

**Resetear PWA:**
```javascript
// 1. Limpiar localStorage
localStorage.clear()

// 2. Desregistrar Service Worker
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.unregister())
})

// 3. Recargar
location.reload()
```

**Forzar actualización:**
```javascript
// Actualizar Service Worker
navigator.serviceWorker.getRegistrations().then(regs => {
  regs.forEach(reg => reg.update())
})
```

---

## 📊 **Estado actual**

Usa este script para verificar todo de una vez:

```javascript
// Pega en la consola (F12)

console.log('📋 === PWA VERIFICATION === 📋\n');

// 1. Protocolo
console.log('🔐 HTTPS:', location.protocol === 'https:' ? '✅' : '❌');

// 2. Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => {
    console.log('🔧 Service Workers:', regs.length > 0 ? '✅ ' + regs.length : '❌ Ninguno');
  });
} else {
  console.log('🔧 Service Workers:', '❌ No soportado');
}

// 3. Manifest
const manifest = document.querySelector('link[rel="manifest"]');
console.log('📄 Manifest:', manifest ? '✅ ' + manifest.href : '❌ No encontrado');

// 4. Dispositivo
const ua = navigator.userAgent.toLowerCase();
console.log('📱 Dispositivo:', 
  /android/.test(ua) ? 'Android' :
  /iphone|ipad|ipod/.test(ua) ? 'iOS' :
  'Desktop'
);

// 5. Instalación
console.log('💾 Modo standalone:', 
  window.matchMedia('(display-mode: standalone)').matches ? '✅ Ya instalada' : '❌ No instalada'
);
```

---

## 📚 **Documentación relacionada**

- [PWA-INSTALL-GUIDE.md](./PWA-INSTALL-GUIDE.md) - Guía completa de instalación
- [pwa-debug-script.js](./pwa-debug-script.js) - Script de debug avanzado
- [manifest.json](./public/manifest.json) - Configuración de la app
- [next.config.js](./next.config.js) - Configuración de Next.js PWA

---

## 🎯 **Próximos pasos**

1. Verifica que tu sitio esté en producción (Vercel)
2. Abre tu celular y ve a la URL
3. Espera a que aparezca el prompt
4. Instala la app
5. Prueba que funcione offline
6. ¡Comparte con tus usuarios! 🚀

---

**Última actualización:** 11 de noviembre de 2025
