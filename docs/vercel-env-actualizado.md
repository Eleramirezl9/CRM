# 🔧 Variables de Entorno ACTUALIZADAS para Vercel

## ✅ Variables CORRECTAS que DEBES configurar en Vercel:

### 1. Base de Datos (Supabase) - ACTUALIZADAS
```
DATABASE_URL=postgresql://postgres.dsrscfajkbjneamnmhlh:aXDoaqSfJUsvTYMD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true

DIRECT_URL=postgresql://postgres.dsrscfajkbjneamnmhlh:aXDoaqSfJUsvTYMD@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

### 2. Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://dsrscfajkbjneamnmhlh.supabase.co

NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcnNjZmFqa2JqbmVhbW5taGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNTQ4MDEsImV4cCI6MjA3NDkzMDgwMX0.D9X1003e4IN8_ibZi6_2yWigFWvi0fpqNfDuNH6zmWc
```

### 3. NextAuth Configuration
```
NEXTAUTH_URL=https://tu-app.vercel.app
NEXTAUTH_SECRET=KkiISalZ3IEqJwScQXazBpBHoX7GPsXOlR+owTCyHrHW+llQLkwfrut61GEo0YRJgooaLby3Kmf4uc0SbCQ56Q==
```

## 🚨 CAMBIOS IMPORTANTES:

### ❌ URLs ANTERIORES (INCORRECTAS):
```
DATABASE_URL=postgresql://postgres:aXDoaqSfJUsvTYMD@db.dsrscfajkbjneamnmhlh.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
```

### ✅ URLs NUEVAS (CORRECTAS):
```
DATABASE_URL=postgresql://postgres.dsrscfajkbjneamnmhlh:aXDoaqSfJUsvTYMD@aws-1-us-east-2.pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.dsrscfajkbjneamnmhlh:aXDoaqSfJUsvTYMD@aws-1-us-east-2.pooler.supabase.com:5432/postgres
```

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
- ✅ `DATABASE_URL` → Nueva URL con pooler
- ✅ `DIRECT_URL` → Nueva URL directa
- ✅ `NEXTAUTH_URL` → Cambiar por tu URL real de Vercel

### 4. Después de actualizar:
1. Ve a **Deployments**
2. Haz un **Redeploy** del último deployment
3. O haz push de un commit para trigger un nuevo deploy

## 🔍 Verificación:
Después del redeploy, prueba:
- https://tu-app.vercel.app/iniciar-sesion
- Usa: `admin@empresa.com` / `admin123`

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
