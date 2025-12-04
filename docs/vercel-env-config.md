# 🔧 Variables de Entorno para Vercel

## Variables que DEBES configurar en Vercel:

### 1. Base de Datos (Supabase)
```
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-DB-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?pgbouncer=true&connection_limit=1
DIRECT_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-DB-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

### 2. Supabase Configuration
```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-SUPABASE-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SUPABASE-SERVICE-ROLE-KEY]
```

### 3. NextAuth Configuration (IMPORTANTE)
```
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=[YOUR-GENERATED-SECRET]
```

## 📍 Dónde Obtener las Credenciales

### Supabase
1. **Database Connection Strings**:
   - Ve a: https://supabase.com/dashboard/project/_/settings/database
   - Copia la "Connection string" en modo "Transaction" para DATABASE_URL
   - Copia la "Direct connection" para DIRECT_URL

2. **API Keys**:
   - Ve a: https://supabase.com/dashboard/project/_/settings/api
   - Copia el "Project URL" para NEXT_PUBLIC_SUPABASE_URL
   - Copia "anon public" para NEXT_PUBLIC_SUPABASE_ANON_KEY
   - Copia "service_role" (¡NUNCA expongas esta key!) para SUPABASE_SERVICE_ROLE_KEY

### NextAuth Secret
Genera un secret seguro:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 🚨 PASOS PARA CONFIGURAR EN VERCEL:

### 1. Ve a tu proyecto en Vercel Dashboard
- https://vercel.com/dashboard
- Selecciona tu proyecto

### 2. Configurar Variables de Entorno
1. Ve a **Settings** → **Environment Variables**
2. Agrega cada variable de arriba
3. Marca todas como **Production**, **Preview**, y **Development**

### 3. Variables Críticas Requeridas:
- `DATABASE_URL` - Connection string con pooler
- `DIRECT_URL` - Direct connection string
- `NEXT_PUBLIC_SUPABASE_URL` - URL de tu proyecto Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Anon key pública
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (mantener secreta)
- `NEXTAUTH_URL` - URL de tu aplicación en Vercel
- `NEXTAUTH_SECRET` - Secret generado aleatoriamente

### 4. Después de configurar:
1. Ve a **Deployments**
2. Haz un **Redeploy** del último deployment
3. O haz push de un commit para trigger un nuevo deploy

## 🔍 Verificación:
Después del redeploy, prueba:
- https://your-app.vercel.app/iniciar-sesion
- Usa las credenciales de prueba del seed

## 🛠️ Comando para Redeploy (si tienes Vercel CLI):
```bash
vercel --prod
```

## ⚠️ IMPORTANTE - SEGURIDAD

**NUNCA commitees credenciales reales al repositorio Git.**

- ✅ Usa placeholders en archivos de documentación
- ✅ Configura credenciales solo en Vercel Dashboard
- ✅ Mantén `.env` en `.gitignore`
- ✅ Rota credenciales periódicamente (cada 90 días)
- ✅ Revisa que `SUPABASE_SERVICE_ROLE_KEY` nunca esté en código cliente
