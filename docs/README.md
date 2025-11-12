# 📚 Documentación del Sistema CRM Multi-Sucursal

Documentación técnica completa del sistema de administración empresarial.

---

## 🚀 Inicio Rápido

### Para Nuevos Desarrolladores
1. **[INICIO-RAPIDO.md](./INICIO-RAPIDO.md)** - Setup inicial del proyecto
2. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura y patrones
3. **[CLAUDE.md](./CLAUDE.md)** - Guía para trabajar con Claude Code

### Para Deployments
1. **[VERCEL_SETUP.md](./VERCEL_SETUP.md)** - Deploy en Vercel
2. **[vercel-env-config.md](./vercel-env-config.md)** - Variables de entorno

---

## 📖 Documentación por Tema

### 🏗️ Arquitectura
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitectura Feature-Driven detallada
- **[arquitectura-ddd.md](./arquitectura-ddd.md)** - Conceptos de Domain-Driven Design
- **[ESTRUCTURA-ESPAÑOL.md](./ESTRUCTURA-ESPAÑOL.md)** - Convenciones de nomenclatura

### 🔐 Seguridad
- **[SEGURIDAD-Y-PERMISOS.md](./SEGURIDAD-Y-PERMISOS.md)** - Sistema completo de autenticación, autorización y permisos
  - Autenticación con NextAuth.js
  - Control de acceso por roles (RBAC)
  - Middleware de protección
  - Invalidación de sesiones
  - Mejores prácticas de seguridad

### 📱 Progressive Web App (PWA)
- **[PWA-GUIA-COMPLETA.md](./PWA-GUIA-COMPLETA.md)** - Guía completa de implementación y troubleshooting
  - Implementación técnica
  - Instalación y verificación
  - Solución de problemas
  - Diferencias por plataforma
  - Próximos pasos opcionales

### ⚙️ Configuración
- **[CONFIGURACION-SUPABASE.md](./CONFIGURACION-SUPABASE.md)** - Setup de Supabase
- **[vercel-env-config.md](./vercel-env-config.md)** - Configuración de variables de entorno
- **[vercel-env-actualizado.md](./vercel-env-actualizado.md)** - Variables actualizadas
- **[fix-database-url.md](./fix-database-url.md)** - Solución de problemas con URLs de BD

### 🚀 Deployment
- **[VERCEL_SETUP.md](./VERCEL_SETUP.md)** - Guía completa de deployment en Vercel

### 🧪 Testing
- **[testing.md](./testing.md)** - Estrategias y guías de testing

### 🤖 IA y Herramientas
- **[CLAUDE.md](./CLAUDE.md)** - Guía completa para Claude Code
- **[AGENTE-ARQUITECTO.md](./AGENTE-ARQUITECTO.md)** - Uso del agente arquitecto

---

## 📂 Estructura de Archivos

```
docs/
├── README.md                           # Este archivo
│
├── 🚀 Inicio
│   ├── INICIO-RAPIDO.md               # Setup inicial
│   ├── CLAUDE.md                       # Guía para Claude Code
│   └── AGENTE-ARQUITECTO.md           # Agente especializado
│
├── 🏗️ Arquitectura
│   ├── ARCHITECTURE.md                 # Arquitectura principal
│   ├── arquitectura-ddd.md            # Domain-Driven Design
│   └── ESTRUCTURA-ESPAÑOL.md          # Convenciones de código
│
├── 🔐 Seguridad
│   └── SEGURIDAD-Y-PERMISOS.md        # Sistema completo de seguridad
│
├── 📱 PWA
│   └── PWA-GUIA-COMPLETA.md           # Guía completa de PWA
│
├── ⚙️ Configuración
│   ├── CONFIGURACION-SUPABASE.md      # Setup de Supabase
│   ├── vercel-env-config.md           # Variables de entorno
│   ├── vercel-env-actualizado.md      # Variables actualizadas
│   └── fix-database-url.md            # Troubleshooting BD
│
├── 🚀 Deployment
│   └── VERCEL_SETUP.md                # Deploy en Vercel
│
└── 🧪 Testing
    └── testing.md                      # Guías de testing
```

---

## 🎯 Casos de Uso Comunes

### "Necesito configurar el proyecto desde cero"
→ **[INICIO-RAPIDO.md](./INICIO-RAPIDO.md)**

### "Quiero entender cómo está organizado el código"
→ **[ARCHITECTURE.md](./ARCHITECTURE.md)**

### "Necesito agregar un nuevo rol o permiso"
→ **[SEGURIDAD-Y-PERMISOS.md](./SEGURIDAD-Y-PERMISOS.md)**

### "La PWA no se instala en móviles"
→ **[PWA-GUIA-COMPLETA.md](./PWA-GUIA-COMPLETA.md)** - Sección "Solución de Problemas"

### "Voy a hacer deploy a producción"
→ **[VERCEL_SETUP.md](./VERCEL_SETUP.md)**

### "Trabajo con Claude Code"
→ **[CLAUDE.md](./CLAUDE.md)**

### "Necesito configurar Supabase"
→ **[CONFIGURACION-SUPABASE.md](./CONFIGURACION-SUPABASE.md)**

---

## 🔄 Actualizaciones Recientes

### 2024-01 - Consolidación de Documentación
- ✅ Consolidados todos los archivos PWA en **PWA-GUIA-COMPLETA.md**
- ✅ Consolidados archivos de seguridad en **SEGURIDAD-Y-PERMISOS.md**
- ✅ Eliminados archivos duplicados y redundantes
- ✅ Reorganizada estructura de docs/

### 2024-01 - PWA Implementation
- ✅ Implementado sistema completo de PWA
- ✅ Componente PWARegistration para registro de Service Worker
- ✅ Componente InstallPWA con dos variantes (floating/inline)
- ✅ Soporte para Android e iOS
- ✅ Sistema de fallback automático

### 2024-01 - Security Enhancements
- ✅ Sistema de invalidación de sesiones
- ✅ Control granular de permisos
- ✅ Middleware de protección mejorado
- ✅ Validación en Server Actions

---

## 🤝 Contribuir a la Documentación

### Agregar Nueva Documentación
1. Crea el archivo en la carpeta correspondiente de `docs/`
2. Usa formato Markdown con emojis para secciones
3. Incluye índice al inicio si el documento es largo
4. Actualiza este README.md agregando el link

### Actualizar Documentación Existente
1. Mantén la estructura de encabezados
2. Agrega fecha de actualización si es cambio significativo
3. Usa ejemplos de código cuando sea posible

### Convenciones
- **Nombres de archivos:** MAYÚSCULAS con guiones (e.g., `GUIA-NUEVA.md`)
- **Emojis:** Usa para marcar secciones principales
- **Código:** Usa bloques de código con syntax highlighting
- **Links:** Usa rutas relativas para links internos

---

## 📞 Soporte

### Documentación Oficial
- [Next.js](https://nextjs.org/docs)
- [Prisma](https://www.prisma.io/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [Supabase](https://supabase.com/docs)

### Para Claude Code
Consulta **[CLAUDE.md](./CLAUDE.md)** que contiene:
- Project overview completo
- Comandos de desarrollo
- Patrones arquitectónicos
- Convenciones de código
- Mejores prácticas

---

## 🎉 Resumen

Esta documentación cubre:
- ✅ Setup e inicio rápido
- ✅ Arquitectura y patrones
- ✅ Seguridad y permisos
- ✅ PWA implementation
- ✅ Configuración y deployment
- ✅ Testing y mejores prácticas

Para volver al README principal del proyecto: [../README.md](../README.md)
