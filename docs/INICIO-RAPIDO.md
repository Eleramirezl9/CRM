# 🚀 Inicio Rápido - Multi-Sucursal

## ⚡ Instalación en 5 Pasos

### 1️⃣ Instalar dependencias
```bash
npm install
```

### 2️⃣ Configurar variables de entorno
```bash
# En Windows PowerShell
Copy-Item .env.example .env

# En Windows CMD
copy .env.example .env
```

**⚠️ IMPORTANTE:** Edita el archivo `.env` y reemplaza los placeholders con tus credenciales reales de Supabase.

### 3️⃣ Generar cliente de Prisma
```bash
npm run prisma:generate
```

### 4️⃣ Crear tablas en Supabase
```bash
npm run prisma:migrate
```
Cuando pregunte el nombre: escribe `init` y presiona Enter

### 5️⃣ Poblar con datos de prueba
```bash
npm run seed
```

### ✅ Iniciar el servidor
```bash
npm run dev
```

Abre: **http://localhost:3000**

---

## 🔐 Credenciales de Prueba

### 👨‍💼 Administrador (Acceso Total)
```
Email:    admin@empresa.com
Password: admin123
```

### 📦 Bodega (Inventario + Envíos)
```
Email:    bodega@empresa.com
Password: bodega123
```

### 🏪 Sucursal (Ventas + Inventario)
```
Email:    sucursal@empresa.com
Password: sucursal123
```

---

## 📊 Datos Creados Automáticamente

✅ **3 Roles** (administrador, bodega, sucursal)  
✅ **3 Usuarios** de prueba  
✅ **1 Empresa** demo  
✅ **4 Sucursales** (1 bodega + 3 sucursales)  
✅ **6 Productos** de ejemplo  
✅ **Inventarios** inicializados con stock  
✅ **2 Ventas** de ejemplo  
✅ **1 Envío** pendiente  

---

## 🎯 Flujo de Prueba Recomendado

### 1. Iniciar como Administrador
1. Login con `admin@empresa.com`
2. Ver Dashboard con KPIs reales
3. Revisar alertas de stock crítico
4. Ver sugerencias de envíos inteligentes

### 2. Gestionar Productos
1. Ir a **Productos**
2. Ver lista con badges de stock crítico
3. Crear nuevo producto (SKU se genera automático)
4. Editar producto existente

### 3. Controlar Inventario
1. Ir a **Inventario**
2. Ver vista consolidada de todas las sucursales
3. Registrar movimiento (entrada/salida)
4. Ver confirmación con stock anterior y nuevo

### 4. Planificar Envíos
1. Ir a **Envíos**
2. Ver sugerencias inteligentes basadas en stock crítico
3. Crear nuevo envío de Bodega → Sucursal
4. Cambiar estado: Pendiente → En Preparación → En Tránsito → Entregado
5. Ver cómo se actualiza el inventario automáticamente

### 5. Registrar Ventas (como Sucursal)
1. Cerrar sesión
2. Login con `sucursal@empresa.com`
3. Ir a **Ventas**
4. Agregar productos al carrito
5. Registrar venta
6. Ver cómo se actualiza el inventario automáticamente
7. Ver estadísticas en tiempo real

### 6. Ver Reportes
1. Login como administrador
2. Ir a **Reportes**
3. Ver gráficos de ventas y utilidad
4. Simular descarga de PDF/Excel

---

## 🛠️ Comandos Útiles

```bash
# Desarrollo
npm run dev                    # Iniciar servidor (puerto 3000)

# Base de Datos
npm run prisma:studio          # Abrir GUI de base de datos
npm run prisma:generate        # Regenerar cliente Prisma
npm run prisma:migrate         # Crear nueva migración
npm run seed                   # Poblar con datos de prueba

# Producción
npm run build                  # Compilar para producción
npm start                      # Iniciar en producción
```

---

## 🔍 Verificar Instalación

### ✅ Checklist

- [ ] `node_modules/` existe
- [ ] `.env` existe y tiene las credenciales
- [ ] `npm run prisma:generate` ejecutado sin errores
- [ ] `npm run prisma:migrate` creó las tablas
- [ ] `npm run seed` pobló los datos
- [ ] `npm run dev` inicia sin errores
- [ ] Puedes abrir http://localhost:3000
- [ ] Puedes iniciar sesión con admin@empresa.com

---

## 🚨 Solución de Problemas

### ❌ Error: "Cannot find module"
```bash
npm install
```

### ❌ Error: "Prisma Client not generated"
```bash
npm run prisma:generate
```

### ❌ Error: "Can't reach database server"
Verifica que `.env` tenga las credenciales correctas de Supabase

### ❌ Error: "Migration failed"
Si ya existen tablas:
```bash
npx prisma migrate reset
npm run prisma:migrate
npm run seed
```

### ❌ Puerto 3000 ocupado
```bash
# Cambiar puerto en package.json
"dev": "next dev -p 3001"
```

---

## 📱 Acceso desde Otros Dispositivos

Para acceder desde tu celular o tablet en la misma red:

1. Obtén tu IP local:
```bash
# Windows
ipconfig
# Busca "IPv4 Address"
```

2. Actualiza `.env`:
```env
NEXTAUTH_URL="http://TU_IP:3000"
```

3. Accede desde otro dispositivo:
```
http://TU_IP:3000
```

---

## 🎨 Módulos Disponibles

| Módulo | Ruta | Descripción |
|--------|------|-------------|
| Dashboard | `/dashboard` | KPIs, alertas, resumen por sucursal |
| Productos | `/dashboard/productos` | CRUD con auto-SKU y alertas |
| Inventario | `/dashboard/inventario` | Vista global, movimientos, alertas |
| Envíos | `/dashboard/envios` | Planificador con sugerencias IA |
| Ventas | `/dashboard/ventas` | POS rápido con carrito |
| Reportes | `/dashboard/reportes` | Gráficos y descargas |

---

## 🎯 Próximos Pasos

1. ✅ Explora todos los módulos
2. ✅ Prueba con los 3 roles diferentes
3. ✅ Crea tus propios productos
4. ✅ Registra ventas reales
5. ✅ Planifica envíos entre sucursales
6. ✅ Personaliza según tus necesidades

---

## 📚 Documentación Adicional

- `README.md` - Documentación completa del proyecto
- `CONFIGURACION-SUPABASE.md` - Detalles de Supabase
- `ESTRUCTURA-ESPAÑOL.md` - Arquitectura del proyecto

---

**¡Listo para maximizar la rentabilidad de tu negocio!** 🚀💰
