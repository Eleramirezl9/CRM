# 🔧 Variables de Entorno ACTUALIZADAS para Vercel

## ✅ Variables CORRECTAS que DEBES configurar en Vercel:

### 1. Base de Datos (Supabase) - FORMATO ACTUALIZADO
```
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-DB-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-DB-PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

### 2. Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-SUPABASE-ANON-KEY]
```

### 3. NextAuth Configuration
```
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=[YOUR-GENERATED-SECRET]
```

## 🚨 CAMBIOS IMPORTANTES:

### ❌ URLs ANTERIORES (FORMATO ANTIGUO):
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

### ✅ URLs NUEVAS (FORMATO CORRECTO):
```
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

## 📍 Dónde Obtener las Credenciales

### Supabase Database URL
1. Ve a: https://supabase.com/dashboard/project/_/settings/database
2. En "Connection String", selecciona el modo "URI"
3. Copia la URL con el nuevo formato de pooler (aws-1-us-east-2.pooler.supabase.com)
4. Para DIRECT_URL, usa el puerto 5432 en lugar de 6543

### Otros Valores
- **NEXT_PUBLIC_SUPABASE_URL**: https://supabase.com/dashboard/project/_/settings/api
- **NEXT_PUBLIC_SUPABASE_ANON_KEY**: https://supabase.com/dashboard/project/_/settings/api
- **NEXTAUTH_SECRET**: Genera con `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`
- **NEXTAUTH_URL**: Tu URL de producción en Vercel

## 🚀 PASOS PARA ACTUALIZAR EN VERCEL:

### 1. Ve a tu proyecto en Vercel Dashboard
- https://vercel.com/dashboard
- Selecciona tu proyecto CRM

### 2. Actualizar Variables de Entorno
1. Ve a **Settings** → **Environment Variables**
2. **ELIMINA** las variables DATABASE_URL y DIRECT_URL existentes
3. **AGREGA** las nuevas variables con las URLs correctas
4. Marca todas como **Production**, **Preview**, y **Development**

### 3. Variables que DEBES actualizar:
- ✅ `DATABASE_URL` → Nueva URL con pooler (puerto 6543)
- ✅ `DIRECT_URL` → Nueva URL directa (puerto 5432)
- ✅ `NEXTAUTH_URL` → Cambiar por tu URL real de Vercel

### 4. Después de actualizar:
1. Ve a **Deployments**
2. Haz un **Redeploy** del último deployment
3. O haz push de un commit para trigger un nuevo deploy

## 🔍 Verificación:
Después del redeploy, prueba:
- https://your-app.vercel.app/iniciar-sesion
- Usa las credenciales de prueba del seed

## 📋 Lista de verificación:
- [ ] DATABASE_URL actualizada con pooler
- [ ] DIRECT_URL configurada
- [ ] NEXT_PUBLIC_SUPABASE_URL correcta
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY configurada
- [ ] NEXTAUTH_URL con tu dominio real
- [ ] NEXTAUTH_SECRET configurada
- [ ] Redeploy ejecutado

## 🛠️ Si tienes problemas:
1. Verifica que todas las variables estén en **Production**
2. Haz un redeploy completo
3. Revisa los logs de Vercel en caso de errores

## ⚠️ IMPORTANTE - SEGURIDAD

**NUNCA commitees credenciales reales al repositorio Git.**

Este archivo contiene solo PLACEHOLDERS. Obtén tus credenciales reales desde:
- Supabase Dashboard: https://supabase.com/dashboard
- Configura las credenciales SOLO en Vercel Dashboard
- Rota credenciales periódicamente por seguridad
