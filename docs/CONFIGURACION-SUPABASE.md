# 🚀 Configuración con Supabase

Este proyecto está configurado para usar **Supabase** como base de datos PostgreSQL.

## 📋 Credenciales del Proyecto

**Proyecto:** Multi-Sucursal  
**URL:** https://dsrscfajkbjneamnmhlh.supabase.co

### 🔑 Variables de Entorno

1. Copia el archivo de ejemplo:

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Windows CMD
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

2. Edita el archivo `.env` y reemplaza los placeholders con tus credenciales reales de Supabase:

```env
# Supabase Database Connection
DATABASE_URL="postgresql://postgres.[TU-PROJECT-REF]:[TU-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[TU-PROJECT-REF]:[TU-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"

# Supabase Keys
NEXT_PUBLIC_SUPABASE_URL="https://[TU-PROJECT-REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="tu-anon-key-real"
SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key-real"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secreto-generado"
```

### 📍 Dónde Obtener las Credenciales

1. **Database URL**: 
   - Ve a: https://supabase.com/dashboard/project/_/settings/database
   - Copia la "Connection string" en modo "Transaction"

2. **API Keys**:
   - Ve a: https://supabase.com/dashboard/project/_/settings/api
   - Copia el "anon public" y "service_role"

3. **NEXTAUTH_SECRET**:
   - Genera uno con: `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

## 🛠️ Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Copiar variables de entorno

```bash
cp .env.example .env
```

### 3. Generar cliente de Prisma

```bash
npm run prisma:generate
```

### 4. Crear las tablas en Supabase

```bash
npm run prisma:migrate
```

Cuando te pregunte el nombre de la migración, escribe: `init`

### 5. Poblar la base de datos con datos de prueba

```bash
npm run seed
```

Esto creará:
- ✅ 3 roles (administrador, bodega, sucursal)
- ✅ 3 usuarios de prueba
- ✅ 1 empresa demo
- ✅ 4 sucursales (1 bodega + 3 sucursales)
- ✅ 6 productos de ejemplo
- ✅ Inventarios inicializados
- ✅ 2 ventas de ejemplo
- ✅ 1 envío pendiente

### 6. Iniciar el servidor de desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

## 🔐 Credenciales de Acceso

Después del seed, puedes iniciar sesión con:

### Administrador
- **Email:** admin@empresa.com
- **Password:** admin123
- **Acceso:** Todos los módulos

### Bodega
- **Email:** bodega@empresa.com
- **Password:** bodega123
- **Acceso:** Dashboard, Inventario, Envíos

### Sucursal
- **Email:** sucursal@empresa.com
- **Password:** sucursal123
- **Acceso:** Dashboard, Ventas, Inventario

## 🗄️ Acceso a Supabase Dashboard

Puedes ver y administrar tu base de datos directamente en:

**URL:** https://supabase.com/dashboard/project/dsrscfajkbjneamnmhlh

Desde ahí puedes:
- Ver las tablas creadas
- Ejecutar queries SQL
- Ver logs
- Administrar usuarios
- Configurar políticas de seguridad (RLS)

## 📊 Estructura de la Base de Datos

El schema de Prisma creará automáticamente estas tablas:

```
roles
usuarios
empresas
sucursales
productos
inventarios
movimientos_inventario
envios
envio_items
ventas
venta_items
notificaciones
```

## 🔧 Comandos Útiles

```bash
# Ver la base de datos en una GUI
npm run prisma:studio

# Crear una nueva migración después de cambios en schema.prisma
npm run prisma:migrate

# Regenerar el cliente de Prisma
npm run prisma:generate

# Resetear la base de datos (⚠️ BORRA TODOS LOS DATOS)
npx prisma migrate reset

# Ver el estado de las migraciones
npx prisma migrate status
```

## 🔒 Notas de Seguridad

### ⚠️ IMPORTANTE

Las credenciales en `.env.example` son **SOLO PARA DESARROLLO**. 

Para producción:
1. ✅ Usa variables de entorno del servidor
2. ✅ Nunca commitees el archivo `.env`
3. ✅ Rota las claves periódicamente
4. ✅ Habilita Row Level Security (RLS) en Supabase
5. ✅ Configura políticas de acceso apropiadas

## 🚨 Solución de Problemas

### Error: "Can't reach database server"

Verifica que:
- ✅ Las credenciales en `.env` sean correctas
- ✅ Tu IP esté permitida en Supabase (Settings → Database → Connection Pooling)
- ✅ El proyecto de Supabase esté activo

### Error: "Migration failed"

Si ya existen tablas:
```bash
npx prisma migrate reset
npm run prisma:migrate
npm run seed
```

### Error: "Prisma Client not generated"

```bash
npm run prisma:generate
```

## 📈 Próximos Pasos

1. ✅ Ejecuta las migraciones
2. ✅ Ejecuta el seed
3. ✅ Inicia el servidor
4. ✅ Inicia sesión con las credenciales de prueba
5. ✅ Explora los módulos del sistema

## 🎯 Ventajas de Usar Supabase

- ✅ **PostgreSQL gestionado** - No necesitas configurar tu propio servidor
- ✅ **Backups automáticos** - Tus datos están seguros
- ✅ **Escalabilidad** - Crece con tu negocio
- ✅ **Dashboard intuitivo** - Administra tu BD visualmente
- ✅ **APIs automáticas** - REST y GraphQL generadas automáticamente
- ✅ **Autenticación integrada** - Aunque usamos NextAuth en este proyecto
- ✅ **Storage** - Para archivos y imágenes (futuro)
- ✅ **Edge Functions** - Para lógica serverless (futuro)

---

**¡Listo para comenzar!** 🚀

```bash
npm install
cp .env.example .env
npm run prisma:generate
npm run prisma:migrate
npm run seed
npm run dev
```
