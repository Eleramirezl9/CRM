# Guía de Pruebas de API con Postman

Esta guía te muestra cómo probar los endpoints del CRM usando Postman.

## 📋 Tabla de Contenidos

1. [Autenticación](#autenticación)
2. [Endpoints Disponibles](#endpoints-disponibles)
3. [Ejemplos Prácticos](#ejemplos-prácticos)

---

## 🔐 Autenticación

Tu aplicación usa **NextAuth.js con JWT**. Para hacer requests autenticados necesitas obtener la cookie de sesión.

### Paso 1: Obtener Cookie de Sesión

**Método 1: Desde el Navegador (Recomendado)**

1. Inicia sesión en tu aplicación: `http://localhost:3000/iniciar-sesion`
2. Presiona F12 (DevTools)
3. Ve a la pestaña **Application** (o **Aplicación**)
4. En el menú izquierdo: **Cookies** → `http://localhost:3000`
5. Busca la cookie `next-auth.session-token`
6. Copia el **Value** (el token largo)

**Método 2: Login Programático con Postman**

```
POST http://localhost:3000/api/auth/callback/credentials
Content-Type: application/x-www-form-urlencoded

correo=admin@empresa.com
password=Admin@2025
```

Luego en la respuesta busca el header `Set-Cookie` y copia el valor de `next-auth.session-token`.

### Paso 2: Configurar Postman

1. Abre Postman
2. Crea una nueva request
3. Ve a la pestaña **Headers**
4. Agrega un header:
   - **Key:** `Cookie`
   - **Value:** `next-auth.session-token=TU_TOKEN_AQUI`

Alternativamente, ve a la pestaña **Cookies** en Postman y agrega:
- **Domain:** `localhost`
- **Path:** `/`
- **Name:** `next-auth.session-token`
- **Value:** `TU_TOKEN_AQUI`

---

## 📡 Endpoints Disponibles

### 1. **Inventario de Sucursal**

**Obtener inventario de una sucursal específica**

```
GET http://localhost:3000/api/sucursales/{id}/inventario
```

**Parámetros:**
- `{id}`: ID de la sucursal (ejemplo: "cm2wg6pkb0000wcpvmz29ryzw")

**Headers:**
```
Cookie: next-auth.session-token=TU_TOKEN
```

**Respuesta (200 OK):**
```json
{
  "success": true,
  "productos": [
    {
      "id": "inv-123",
      "sucursalId": "suc-001",
      "productoId": "prod-001",
      "cantidadActual": 50,
      "stockMinimo": 20,
      "producto": {
        "id": "prod-001",
        "sku": "SKU-PAN-001",
        "nombre": "Pan Francés",
        "precioVenta": 1.00
      }
    }
  ]
}
```

**Códigos de Error:**
- `401`: No autenticado (cookie inválida o expirada)
- `403`: Sin acceso a esta sucursal (usuarios de sucursal solo ven su propia sucursal)
- `500`: Error del servidor

---

### 2. **Producción Diaria**

#### **GET - Listar Producción**

```
GET http://localhost:3000/api/produccion-diaria
```

**Query Parameters (opcionales):**
- `fecha`: Filtrar por fecha (formato: YYYY-MM-DD)
- `enviado`: Filtrar por estado de envío (true/false)

**Ejemplos:**
```
GET http://localhost:3000/api/produccion-diaria?fecha=2025-11-07
GET http://localhost:3000/api/produccion-diaria?enviado=false
GET http://localhost:3000/api/produccion-diaria?fecha=2025-11-07&enviado=true
```

**Respuesta (200 OK):**
```json
{
  "success": true,
  "producciones": [
    {
      "id": 1,
      "fecha": "2025-11-07T00:00:00.000Z",
      "productoId": "prod-001",
      "cantidadContenedores": 10,
      "unidadesPorContenedor": 50,
      "totalUnidades": 500,
      "enviado": false,
      "observaciones": "Producción normal",
      "producto": {
        "sku": "SKU-PAN-001",
        "nombre": "Pan Francés"
      }
    }
  ]
}
```

#### **POST - Registrar Producción**

```
POST http://localhost:3000/api/produccion-diaria
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "fecha": "2025-11-07",
  "productoId": "cm2wg6pkb0000wcpvmz29ryzw",
  "cantidadContenedores": 15,
  "unidadesPorContenedor": 60,
  "observaciones": "Producción extra para fin de semana"
}
```

**Campos:**
- `fecha` (opcional): Fecha de producción (default: hoy)
- `productoId` (requerido): ID del producto
- `cantidadContenedores` (requerido): Número de contenedores producidos
- `unidadesPorContenedor` (requerido): Unidades por contenedor
- `observaciones` (opcional): Notas adicionales

**Respuesta (200 OK):**
```json
{
  "success": true,
  "produccion": {
    "id": 1,
    "fecha": "2025-11-07T00:00:00.000Z",
    "productoId": "cm2wg6pkb0000wcpvmz29ryzw",
    "cantidadContenedores": 15,
    "unidadesPorContenedor": 60,
    "totalUnidades": 900,
    "enviado": false,
    "observaciones": "Producción extra para fin de semana",
    "producto": {
      "sku": "SKU-PAN-001",
      "nombre": "Pan Francés"
    }
  }
}
```

**Códigos de Error:**
- `400`: Datos inválidos (campos faltantes o cantidades <= 0)
- `401`: No autenticado
- `403`: Sin permisos (solo rol 'produccion' o 'admin')
- `500`: Error del servidor

#### **PUT - Marcar como Enviada**

```
PUT http://localhost:3000/api/produccion-diaria
Content-Type: application/json
```

**Body (JSON):**
```json
{
  "id": 1,
  "enviado": true
}
```

**Respuesta (200 OK):**
```json
{
  "success": true,
  "produccion": {
    "id": 1,
    "enviado": true,
    "producto": { ... }
  }
}
```

---

## 🧪 Ejemplos Prácticos

### Escenario 1: Consultar Inventario de una Sucursal

1. **Obtén el ID de una sucursal:**
   - Ve a Prisma Studio: `npm run prisma:studio`
   - Abre la tabla `Sucursal`
   - Copia el `id` de una sucursal (ejemplo: `cm2wg6pkb0001wcpv123abc`)

2. **Configura Postman:**
   - Método: `GET`
   - URL: `http://localhost:3000/api/sucursales/cm2wg6pkb0001wcpv123abc/inventario`
   - Header: `Cookie: next-auth.session-token=TU_TOKEN`

3. **Envía la request**
   - Click en **Send**
   - Deberías recibir la lista de productos en inventario

### Escenario 2: Registrar Producción Diaria

1. **Obtén el ID de un producto:**
   - Ve a Prisma Studio
   - Abre la tabla `Producto`
   - Copia el `id` de un producto

2. **Inicia sesión como usuario de producción:**
   - Email: `produccion@empresa.com`
   - Password: `Produccion@2025`
   - Obtén la cookie de sesión

3. **Configura Postman:**
   - Método: `POST`
   - URL: `http://localhost:3000/api/produccion-diaria`
   - Header: `Content-Type: application/json`
   - Header: `Cookie: next-auth.session-token=TU_TOKEN`
   - Body (JSON):
   ```json
   {
     "productoId": "ID_DEL_PRODUCTO",
     "cantidadContenedores": 20,
     "unidadesPorContenedor": 50,
     "observaciones": "Prueba desde Postman"
   }
   ```

4. **Envía la request**
   - Deberías recibir `{ "success": true, "produccion": {...} }`

### Escenario 3: Probar Control de Permisos

**Test 1: Usuario de Sucursal intenta registrar producción**

1. Inicia sesión como: `sucursal@empresa.com` / `Sucursal@2025`
2. Obtén la cookie
3. Intenta hacer POST a `/api/produccion-diaria`
4. **Resultado esperado:** `403 Forbidden` - "No tienes permisos para registrar producción"

**Test 2: Usuario de Sucursal intenta ver otra sucursal**

1. Inicia sesión como: `sucursal@empresa.com`
2. El usuario está asignado a la sucursal con ID: `X`
3. Intenta hacer GET a `/api/sucursales/Y/inventario` (donde Y ≠ X)
4. **Resultado esperado:** `403 Forbidden` - "No tienes acceso a esta sucursal"

---

## 🔍 Debugging

### Ver Logs del Servidor

Cuando hagas requests, mira la terminal donde corre `npm run dev`. Verás logs como:

```
🔐 Middleware - Rol: produccion, Ruta: /api/produccion-diaria
✅ Acceso permitido: true
```

### Problemas Comunes

**1. Error 401 - No autorizado**
- ✅ Verifica que copiaste toda la cookie (es larga)
- ✅ Asegúrate de que no haya espacios antes/después del token
- ✅ La sesión puede expirar después de 8 horas, inicia sesión de nuevo

**2. Error 403 - Sin permisos**
- ✅ Verifica que el usuario tenga el rol correcto para ese endpoint
- ✅ Usuarios de sucursal solo pueden ver su propia sucursal

**3. Error 400 - Datos inválidos**
- ✅ Verifica que el JSON esté bien formado
- ✅ Asegúrate de enviar todos los campos requeridos
- ✅ Verifica que los IDs sean válidos (existan en la base de datos)

**4. Error 500 - Error del servidor**
- ✅ Mira los logs en la terminal
- ✅ Verifica que la base de datos esté funcionando
- ✅ Asegúrate de que los IDs que envías existan

---

## 📦 Colección de Postman

### Importar Colección

Puedes crear una colección en Postman con estos endpoints:

1. Abre Postman
2. Click en **Import**
3. Copia este JSON:

```json
{
  "info": {
    "name": "CRM API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Inventario",
      "item": [
        {
          "name": "Obtener Inventario de Sucursal",
          "request": {
            "method": "GET",
            "header": [],
            "url": {
              "raw": "http://localhost:3000/api/sucursales/:id/inventario",
              "protocol": "http",
              "host": ["localhost"],
              "port": "3000",
              "path": ["api", "sucursales", ":id", "inventario"],
              "variable": [
                {
                  "key": "id",
                  "value": "cm2wg6pkb0001wcpv123abc"
                }
              ]
            }
          }
        }
      ]
    },
    {
      "name": "Producción",
      "item": [
        {
          "name": "Listar Producción",
          "request": {
            "method": "GET",
            "header": [],
            "url": "http://localhost:3000/api/produccion-diaria"
          }
        },
        {
          "name": "Registrar Producción",
          "request": {
            "method": "POST",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"productoId\": \"PRODUCTO_ID\",\n  \"cantidadContenedores\": 10,\n  \"unidadesPorContenedor\": 50,\n  \"observaciones\": \"Prueba\"\n}"
            },
            "url": "http://localhost:3000/api/produccion-diaria"
          }
        },
        {
          "name": "Marcar como Enviada",
          "request": {
            "method": "PUT",
            "header": [
              {
                "key": "Content-Type",
                "value": "application/json"
              }
            ],
            "body": {
              "mode": "raw",
              "raw": "{\n  \"id\": 1,\n  \"enviado\": true\n}"
            },
            "url": "http://localhost:3000/api/produccion-diaria"
          }
        }
      ]
    }
  ]
}
```

4. Pega el JSON y click en **Import**

### Variables de Entorno

Crea un Environment en Postman:

- Variable: `base_url` → Valor: `http://localhost:3000`
- Variable: `session_token` → Valor: `TU_TOKEN_DE_SESION`

Luego usa:
```
{{base_url}}/api/produccion-diaria
```

---

## 🚀 Próximos Pasos

1. **Prueba todos los endpoints** con diferentes roles
2. **Verifica los permisos** intentando acceder con roles incorrectos
3. **Revisa la auditoría** en Prisma Studio después de hacer requests
4. **Crea más endpoints** según necesites para tu aplicación

---

**Documentación relacionada:**
- [Sistema de Seguridad](./SEGURIDAD-IMPLEMENTADA.md)
- [Sistema de Permisos](./sistema-permisos.md)
- [Arquitectura](./arquitectura-ddd.md)
