# 🚀 Despliegue en Vercel

## Paso 1: Preparar el repositorio en GitHub

```bash
# Inicializar Git (si no está inicializado)
git init

# Agregar todos los archivos
git add .

# Hacer commit
git commit -m "Initial commit - Sistema Multi-Sucursal"

# Conectar con tu repositorio remoto
git remote add origin https://github.com/Eleramirezl9/CRM.git

# Subir a GitHub
git branch -M main
git push -u origin main
```

## Paso 2: Configurar Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. Click en **"Add New Project"**
3. Importa el repositorio: `Eleramirezl9/CRM`
4. Configura las variables de entorno:

### Variables de Entorno Requeridas:




**⚠️ IMPORTANTE:** 
- Cambia `NEXTAUTH_URL` por tu URL real de Vercel después del despliegue
- Puedes editarla en: Settings → Environment Variables

## Paso 3: Build Settings

Vercel detectará automáticamente Next.js. Configuración por defecto:

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Output Directory:** `.next`
- **Install Command:** `npm install`

## Paso 4: Deploy

1. Click en **"Deploy"**
2. Espera a que termine el build (~2-3 minutos)
3. Una vez desplegado, copia la URL (ej: `https://crm-xyz.vercel.app`)
4. Ve a **Settings → Environment Variables**
5. Edita `NEXTAUTH_URL` y ponle tu URL real
6. Haz un nuevo deploy desde **Deployments → Redeploy**

## Paso 5: Verificar Base de Datos

La base de datos ya está configurada en Supabase con:
- ✅ Tablas creadas
- ✅ Datos de prueba
- ✅ Usuarios de ejemplo

**Credenciales de acceso:**
- Email: `admin@empresa.com`
- Password: `admin123`

## 🎉 ¡Listo!

Tu aplicación estará disponible en: `https://tu-app.vercel.app`

## 🔄 Actualizaciones Futuras

Cada vez que hagas `git push` a la rama `main`, Vercel desplegará automáticamente.

```bash
git add .
git commit -m "Descripción de cambios"
git push
```

## 📊 Monitoreo

- **Analytics:** Vercel → Analytics
- **Logs:** Vercel → Deployments → [tu deploy] → Logs
- **Database:** Supabase Dashboard

## ⚠️ Troubleshooting

### Error: "Prisma Client not generated"
Agrega en `package.json`:
```json
{
  "scripts": {
    "postinstall": "prisma generate"
  }
}
```

### Error: "Database connection failed"
Verifica que las variables de entorno estén correctas en Vercel.

### Error: "NextAuth configuration error"
Asegúrate de que `NEXTAUTH_URL` tenga tu URL de Vercel.
