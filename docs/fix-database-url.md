# 🔧 Solución para Error de Conexión a Supabase

## 🚨 Problema Identificado:
```
Can't reach database server at `db.dsrscfajkbjneamnmhlh.supabase.co:5432`
```

## ✅ Solución:

### 1. Actualizar URL de Conexión en Vercel

Ve a tu dashboard de Vercel y actualiza la variable `DATABASE_URL` con el formato correcto:

```
DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[YOUR-DB-PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### 2. URL Alternativa (conexión directa - solo para migraciones):

```
DATABASE_URL=postgresql://postgres:[YOUR-DB-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres?sslmode=require
```

### 3. Pasos en Vercel Dashboard:

1. Ve a: https://vercel.com/dashboard
2. Selecciona: `crm-multi-sucursal`
3. Ve a **Settings** → **Environment Variables**
4. Edita `DATABASE_URL`
5. Reemplaza con una de las URLs de arriba
6. Haz un **Redeploy**

### 4. Verificar en Supabase:

1. Ve a tu proyecto Supabase: https://supabase.com/dashboard
2. Ve a **Settings** → **Database**
3. Copia la **Connection string** oficial
4. Úsala en Vercel

### 5. URLs Recomendadas por Supabase:

**Para aplicaciones (con pooling):**
```
postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Para migraciones (directa):**
```
postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
```

## 🔍 Diagnóstico Adicional:

Si el problema persiste, puede ser:
1. **Firewall de Supabase**: Verificar configuraciones de red
2. **Pooling**: Usar el pooler de Supabase en lugar de conexión directa
3. **SSL**: Agregar `sslmode=require` a la URL
4. **Región**: Verificar que la región sea correcta

## 🚀 Test Rápido:

Después de actualizar la URL, prueba:
```
https://crm-multi-sucursal.vercel.app/api/test-db
```

Debería devolver:
```json
{
  "success": true,
  "message": "✅ Conexión a base de datos exitosa"
}
```
