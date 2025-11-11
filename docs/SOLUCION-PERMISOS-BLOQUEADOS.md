# 🔓 Solución: Permisos Bloqueados y Usuarios Atrapados

**Fecha:** 2025-11-10
**Problema:** Usuarios quedan atrapados en "No autorizado" y permisos no se actualizan aunque el admin los asigne

---

## 🎯 Problemas Identificados y Solucionados

### Problema 1: Usuarios Atrapados en Página "No Autorizado"
**Síntoma:** El usuario accede a una ruta sin permisos, ve "No autorizado", y no puede salir.

**Causa:** La página no tenía botón de navegación.

**✅ Solución Implementada:**
- Agregada página mejorada con:
  - ✅ Botón "Volver al Inicio" → Redirige a `/dashboard`
  - ✅ Botón "Refrescar Permisos" → Recarga permisos del servidor
  - ✅ Diseño claro con instrucciones

**Archivo:** `src/app/no-autorizado/page.tsx`

---

### Problema 2: Permisos NO se Actualizan Inmediatamente
**Síntoma:** Admin asigna permisos a un usuario, pero el usuario sigue sin poder acceder.

**Causa:** Los permisos están **cacheados en el JWT** del navegador. El JWT no se actualiza hasta que:
1. El usuario cierra sesión y vuelve a iniciar
2. El usuario recarga la página
3. Se fuerza actualización con `session.update()`

**✅ Solución Implementada:**

#### 1. Sistema de Invalidación Automática (Ya existía)
- Cuando el admin asigna permisos, se marca la sesión como invalidada en Redis
- En el próximo request, el JWT callback detecta la invalidación y recarga permisos
- **Archivo:** `src/caracteristicas/usuarios/acciones.ts:384`

```typescript
// ✅ Ya estaba implementado
await invalidarSesionUsuario(usuarioId)
```

#### 2. Componente RefreshPermisosButton (Nuevo)
- Botón que el usuario puede usar para refrescar sus permisos manualmente
- Llama a `session.update()` para forzar recarga del JWT
- **Archivo:** `src/compartido/componentes/RefreshPermisosButton.tsx`

```tsx
import { RefreshPermisosButton } from '@/compartido/componentes/RefreshPermisosButton'

// Usar en layout o dashboard
<RefreshPermisosButton />
```

---

## 🛠️ Herramientas de Diagnóstico Creadas

### 1. Script: `test-permisos-usuario.ts`

Prueba si un usuario tiene los permisos correctos en la base de datos.

**Uso:**
```bash
npx tsx scripts/test-permisos-usuario.ts <email>
```

**Ejemplo:**
```bash
npx tsx scripts/test-permisos-usuario.ts bodega@empresa.com
```

**Qué muestra:**
- ✅ Información del usuario (ID, rol, activo)
- ✅ Permisos del rol
- ✅ Permisos individuales
- ✅ Permisos efectivos (combinados)
- ✅ Pruebas de acceso a rutas principales
- ✅ Diagnóstico de problemas
- ✅ Soluciones recomendadas

### 2. Script Existente: `verificar-permisos-usuario.ts`

Similar al anterior, pero con más detalles.

**Uso:**
```bash
npx tsx scripts/verificar-permisos-usuario.ts <email>
```

### 3. Script Existente: `diagnosticar-permisos.ts`

Diagnóstico general del sistema de permisos.

**Uso:**
```bash
npx tsx scripts/diagnosticar-permisos.ts
```

---

## 📖 Guía de Solución por Escenario

### Escenario 1: "El admin asignó permisos pero no funcionan"

**Causa:** Permisos cacheados en el JWT del navegador.

**Solución (El usuario debe hacer UNA de estas):**

1. **Refrescar permisos (RECOMENDADO):**
   - Hacer clic en botón "Refrescar Permisos" (si está disponible)
   - O simplemente recargar la página (F5)

2. **Cerrar y volver a iniciar sesión:**
   - Logout → Login
   - Los permisos se recargan automáticamente

3. **Esperar 5 segundos:**
   - El sistema de invalidación en Redis fuerza la recarga
   - Pero el usuario necesita hacer un nuevo request (navegar a otra página)

**Verificación (para el admin):**
```bash
npx tsx scripts/test-permisos-usuario.ts <email>
```

Si el script muestra que el usuario **SÍ tiene permisos**, entonces el problema es el cache del JWT.

---

### Escenario 2: "El usuario está atrapado en 'No autorizado'"

**Causa:** Intentó acceder a una ruta sin permisos.

**Solución:**

1. **El usuario puede:**
   - Hacer clic en "Volver al Inicio" → Redirige a `/dashboard`
   - Hacer clic en "Refrescar Permisos" → Recarga permisos y página

2. **Si el usuario cerró la ventana:**
   - Simplemente volver a `/dashboard`
   - O cerrar sesión y volver a iniciar

---

### Escenario 3: "Asigné permisos pero el script dice que NO los tiene"

**Causa:** Los permisos NO se guardaron correctamente en la base de datos.

**Verificación:**
```bash
npx tsx scripts/test-permisos-usuario.ts <email>
```

**Si muestra "Total: 0 permisos" o no aparecen los permisos asignados:**

1. **Verificar en la base de datos:**
   ```sql
   -- Ver permisos del rol
   SELECT r.nombre as rol, p.codigo as permiso
   FROM role_permissions rp
   JOIN roles r ON r.id = rp.role_id
   JOIN permissions p ON p.id = rp.permission_id
   WHERE r.nombre = 'nombre_del_rol';

   -- Ver permisos individuales del usuario
   SELECT u.correo, p.codigo as permiso
   FROM user_permissions up
   JOIN usuarios u ON u.id = up.usuario_id
   JOIN permissions p ON p.id = up.permission_id
   WHERE u.correo = 'email@usuario.com';
   ```

2. **Re-asignar los permisos desde el panel de administración**

3. **Verificar que el rol del usuario sea correcto:**
   - Usuario → Ver detalles → Verificar que el rol es el esperado

---

### Escenario 4: "El usuario está INACTIVO"

**Causa:** El usuario fue desactivado.

**Verificación:**
```bash
npx tsx scripts/test-permisos-usuario.ts <email>
```

**Si muestra "❌ CRÍTICO: Usuario está INACTIVO":**

**Solución:**
1. Ir al panel de administración → Usuarios
2. Buscar al usuario
3. Activarlo

O por SQL:
```sql
UPDATE usuarios
SET activo = true
WHERE correo = 'email@usuario.com';
```

---

## 🔄 Flujo Completo de Actualización de Permisos

```
┌─────────────────────────────────────────────────────────────┐
│ 1. ADMIN ASIGNA PERMISOS                                    │
│    - Panel de administración → Usuarios → Permisos          │
│    - Se guardan en tabla user_permissions                   │
│    - Se marca sesión como invalidada en Redis              │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. USUARIO NECESITA REFRESCAR                               │
│    Opciones (cualquiera de estas):                          │
│    a) Hacer clic en "Refrescar Permisos"                   │
│    b) Recargar la página (F5)                               │
│    c) Cerrar sesión y volver a iniciar                      │
│    d) Esperar 5 seg y navegar a otra página                │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. JWT CALLBACK SE EJECUTA                                  │
│    - Detecta invalidación en Redis                          │
│    - Recarga permisos desde la BD                           │
│    - Actualiza token JWT con nuevos permisos               │
│    - Limpia marca de invalidación                          │
└─────────────────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. USUARIO TIENE ACCESO                                     │
│    - Los nuevos permisos están activos                      │
│    - Puede acceder a las rutas permitidas                   │
└─────────────────────────────────────────────────────────────┘
```

---

## 💡 Mejores Prácticas para Evitar Problemas

### Para Administradores:

1. **Después de asignar permisos:**
   - Informar al usuario que debe refrescar la página
   - O mejor: usar el componente `RefreshPermisosButton` en la interfaz

2. **Antes de asignar permisos:**
   - Verificar que el usuario esté activo
   - Verificar que el rol tenga sentido

3. **Si un usuario reporta problemas:**
   - Usar el script de diagnóstico primero:
     ```bash
     npx tsx scripts/test-permisos-usuario.ts <email>
     ```
   - Esto te dirá exactamente qué permisos tiene y si hay problemas

### Para Usuarios:

1. **Si te asignan nuevos permisos:**
   - Haz clic en "Refrescar Permisos" (si está disponible)
   - O simplemente recarga la página (F5)

2. **Si ves "No autorizado":**
   - Haz clic en "Volver al Inicio"
   - Si acabas de recibir permisos, haz clic en "Refrescar Permisos"

3. **Si nada funciona:**
   - Cerrar sesión y volver a iniciar
   - Contactar al administrador

---

## 🧪 Tests de Verificación

### Test 1: Asignar permisos y verificar
```bash
# 1. Asignar permisos desde el panel admin
# 2. Ejecutar:
npx tsx scripts/test-permisos-usuario.ts usuario@email.com

# 3. Verificar que aparezcan los permisos asignados
```

### Test 2: Usuario atrapado en "No autorizado"
```bash
# 1. Acceder a una ruta sin permisos
# 2. Verificar que aparezcan los botones:
#    - "Volver al Inicio"
#    - "Refrescar Permisos"
# 3. Hacer clic en "Volver al Inicio"
# 4. Verificar que redirige a /dashboard
```

### Test 3: Refrescar permisos funciona
```bash
# 1. Admin asigna permisos a un usuario
# 2. Usuario hace clic en "Refrescar Permisos"
# 3. Verificar que puede acceder a la nueva ruta
```

---

## 📊 Estadísticas del Sistema de Permisos

Ejecutar para ver el estado general:
```bash
npx tsx scripts/diagnosticar-permisos.ts
```

Esto muestra:
- Total de permisos en el sistema
- Permisos por rol
- Usuarios con sus permisos
- Relaciones RolePermission
- Verificación de integridad

---

## 🚨 Troubleshooting

### "Los permisos siguen sin funcionar después de refrescar"

**Posibles causas:**

1. **El permiso no existe:**
   ```bash
   # Verificar que el permiso existe
   npx tsx scripts/diagnosticar-permisos.ts | grep "nombre_permiso"
   ```

2. **El middleware bloquea la ruta:**
   - Verificar `middleware.ts` línea 93-124
   - Asegurarse de que la ruta esté en el mapeo

3. **La página no verifica permisos correctamente:**
   - Verificar que la página use `requirePermiso(PERMISOS.X)`

### "El script dice que tiene permisos pero no puede acceder"

**Causa:** Cache del navegador o JWT no actualizado.

**Solución:**
1. Borrar cookies del navegador
2. Cerrar todas las pestañas
3. Volver a iniciar sesión

### "Aparece 'Application error: a server-side exception'"

**Causa:** Alguna Server Action está lanzando excepción en lugar de retornar error.

**Solución:**
1. Ver logs del servidor para identificar la función
2. Verificar que use el patrón resiliente con `checkPermiso()`
3. Ver `RESILIENT-SECURITY-FIX.md` para el patrón correcto

---

## 📞 Soporte

Si sigues teniendo problemas:

1. **Ejecutar diagnóstico:**
   ```bash
   npx tsx scripts/test-permisos-usuario.ts <email>
   ```

2. **Capturar información:**
   - Captura de pantalla del error
   - Email del usuario afectado
   - Qué acción estaba intentando hacer
   - Resultado del script de diagnóstico

3. **Revisar documentación:**
   - `SECURITY-FIX-SUMMARY.md` - Arquitectura de seguridad
   - `RESILIENT-SECURITY-FIX.md` - Patrón resiliente
   - Este documento - Solución de permisos

---

**✅ Con estas correcciones, el sistema de permisos debería funcionar correctamente**
