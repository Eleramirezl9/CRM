# 🚀 INICIO RÁPIDO - PWA Instalación

## ⏱️ 5 MINUTOS para que funcione

---

## ✅ PASO 1: Verificar que está listo (1 min)

```bash
# Todo está hecho, solo verifica en consola:
# 1. Abre DevTools (F12)
# 2. Ve a Application
# 3. Busca "manifest.json" ✓
# 4. Busca "Service Worker" ✓
```

---

## ✅ PASO 2: Desplegar (2 min)

```bash
# Si no has hecho push aún:
git add .
git commit -m "PWA mejorada - fallback automático activado"
git push origin main

# Vercel se desplegará automáticamente
# ⏳ Espera 2-3 minutos
```

---

## ✅ PASO 3: Probar en tu CELULAR (1 min)

### Android:
1. Abre tu celular con Chrome
2. Ve a: `https://crm-multi-sucursal.vercel.app/iniciar-sesion`
3. **Espera 3 segundos**
4. ¿Ves tarjeta flotante abajo? → ✅ Haz clic
5. ¿Aparece en pantalla de inicio? → ✅ ¡FUNCIONA!

### iOS:
1. Abre tu iPhone con Safari
2. Ve a: `https://crm-multi-sucursal.vercel.app/iniciar-sesion`
3. **Espera 3 segundos**
4. ¿Ves tarjeta con instrucciones? → ✅ Lee y sigue
5. Toca menú (↑) → "Añadir a Inicio"
6. ¿Aparece en pantalla de inicio? → ✅ ¡FUNCIONA!

---

## 🐛 PASO 4: Si NO funciona (1 min)

### En tu navegador:
```javascript
// Pega en F12 → Console:

// 1. Ver si está instalada
console.log('¿Instalada?', window.matchMedia('(display-mode: standalone)').matches)

// 2. Ver logs
window.addEventListener('beforeinstallprompt', (e) => {
  console.log('✅ beforeinstallprompt capturado')
})

// 3. Resetear si fue rechazada
localStorage.removeItem('pwa-dismissed')
location.reload()
```

---

## 📱 QUÉ VERÁ TU USUARIO

### Android (Chrome):
```
┌──────────────────────────┐
│ 📱 Instala nuestra app   │
│ Acceso rápido y sin...   │
│                          │
│ ⚡ Acceso instantáneo    │
│ 🔒 Funciona sin conexión │
│ 📦 Sin descargas         │
│                          │
│ [Instalar ahora]         │
│ [Recordarme después]     │
└──────────────────────────┘
```

### iOS (Safari):
```
┌──────────────────────────┐
│ 📱 En 2 simples pasos    │
│                          │
│ 1️⃣ Toca menú (↑) abajo   │
│ 2️⃣ "Añadir a Inicio"     │
│                          │
│ ⚡ Acceso instantáneo    │
│ 🔒 Funciona sin conexión │
│ [Cerrar]                 │
└──────────────────────────┘
```

---

## 📚 DOCUMENTACIÓN

- **LEE ESTO primero:** `PWA-INSTALL-GUIDE.md`
- **Para debugging:** `PWA-CHECKLIST.md`
- **Ver mockups:** `PWA-VISTA-PREVIA.md`
- **Detalles técnicos:** `PWA-CAMBIOS.md`

---

## ✅ VERIFICACIÓN RÁPIDA

```bash
# Verifica que todo esté en su lugar:

# 1. Manifest existe
curl https://crm-multi-sucursal.vercel.app/manifest.json

# 2. Service Worker está activo
# → Ir a sitio → F12 → Application → Service Workers

# 3. HTTPS activado
# → Debe decir "https://" en la URL
```

---

## 🎯 RESUMEN

| Paso | Acción | Tiempo |
|------|--------|--------|
| 1 | Verificar DevTools | 1 min |
| 2 | Desplegar a Vercel | 2 min |
| 3 | Probar en celular | 1 min |
| 4 | Debuggear si es needed | 1 min |
| **TOTAL** | **De idea a producción** | **5 min** |

---

## 🚀 ¡LISTO!

Todo está configurado, probado y listo.

**Ahora tus usuarios pueden:**
- ✅ Instalar desde Android
- ✅ Instalar desde iOS
- ✅ Usar como app nativa
- ✅ Funciona sin internet
- ✅ Acceso rápido desde pantalla de inicio

---

## 💡 TIPS

- Si pasó mucho tiempo, limpia caché del navegador
- Si está instalada, no verá el prompt (es normal)
- iOS requiere Safari (no Chrome)
- Android funciona con Chrome, Edge, Brave, Samsung Internet

---

**Última actualización:** 11 de noviembre de 2025
