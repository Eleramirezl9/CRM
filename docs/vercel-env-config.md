# 🔧 Variables de Entorno para Vercel

## Variables que DEBES configurar en Vercel:

### 1. Base de Datos (Supabase)
```
DATABASE_URL=postgresql://postgres:aXDoaqSfJUsvTYMD@db.dsrscfajkbjneamnmhlh.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres:aXDoaqSfJUsvTYMD@db.dsrscfajkbjneamnmhlh.supabase.co:5432/postgres
```

### 2. Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://dsrscfajkbjneamnmhlh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcnNjZmFqa2JqbmVhbW5taGxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzNTQ4MDEsImV4cCI6MjA3NDkzMDgwMX0.D9X1003e4IN8_ibZi6_2yWigFWvi0fpqNfDuNH6zmWc
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcnNjZmFqa2JqbmVhbW5taGxoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM1NDgwMSwiZXhwIjoyMDc0OTMwODAxfQ.nJl3MqBs9dyyfvz5TzwCieLtVm-CHKUUF5YDSg2yyKI
```

### 3. NextAuth Configuration (IMPORTANTE)
```
NEXTAUTH_URL=https://crm-multi-sucursal.vercel.app
NEXTAUTH_SECRET=KkiISalZ3IEqJwScQXazBpBHoX7GPsXOlR+owTCyHrHW+llQLkwfrut61GEo0YRJgooaLby3Kmf4uc0SbCQ56Q==
```

## 🚨 PASOS PARA CONFIGURAR EN VERCEL:

### 1. Ve a tu proyecto en Vercel Dashboard
- https://vercel.com/dashboard
- Selecciona tu proyecto: `crm-multi-sucursal`

### 2. Configurar Variables de Entorno
1. Ve a **Settings** → **Environment Variables**
2. Agrega cada variable de arriba
3. Marca todas como **Production**, **Preview**, y **Development**

### 3. Variables Críticas que pueden faltar:
- `NEXTAUTH_URL` debe ser: `https://crm-multi-sucursal.vercel.app`
- `NEXTAUTH_SECRET` debe estar configurada
- `DATABASE_URL` y `DIRECT_URL` deben estar configuradas

### 4. Después de configurar:
1. Ve a **Deployments**
2. Haz un **Redeploy** del último deployment
3. O haz push de un commit para trigger un nuevo deploy

## 🔍 Verificación:
Después del redeploy, prueba:
- https://crm-multi-sucursal.vercel.app/iniciar-sesion
- Usa: `admin@empresa.com` / `admin123`

## 🛠️ Comando para Redeploy (si tienes Vercel CLI):
```bash
vercel --prod
```
