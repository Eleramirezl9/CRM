# Sistema de Turnos y Fechas de Producción

## Descripción General

El sistema de producción maneja dos turnos:
- **Turno Mañana**: 4:00 AM - 4:59 PM (04:00 - 16:59)
- **Turno Noche**: 5:00 PM - 3:59 AM (17:00 - 03:59)

## Lógica de Fechas según Turno

La fecha de producción se calcula automáticamente según el turno seleccionado:

| Turno | Fecha de Producción |
|-------|---------------------|
| Mañana | Día actual (hoy) |
| Noche | Día siguiente (mañana) |

### Ejemplos

Si hoy es **20 de noviembre**:
- Seleccionas **Mañana** → fecha = **20/11/2025**
- Seleccionas **Noche** → fecha = **21/11/2025**

### Caso especial: Madrugada (0:00 - 3:59 AM)

Si estás en la madrugada (antes de las 4:00 AM) y seleccionas turno noche, la fecha es el día actual porque ya estás en el día siguiente del turno nocturno.

## Archivos Involucrados

### 1. `src/compartido/lib/turnos.ts`
Define los tipos y funciones utilitarias para turnos:
- `type Turno = 'manana' | 'noche'`
- `detectarTurno(fecha)` - Detecta el turno según la hora
- `getTurnoLabel(turno)` - Obtiene el label para UI
- `getTurnoHorario(turno)` - Obtiene el rango de horas

### 2. `src/caracteristicas/produccion/acciones.ts`
Contiene la lógica del servidor:

#### `registrarProduccion()` (líneas 11-128)
- Calcula la fecha automáticamente según el turno
- Si es turno noche y hora >= 17, suma 1 día a la fecha

#### `obtenerProduccionDiaria()` (líneas 130-179)
- Busca producciones de ayer, hoy y mañana
- Usa fechas en UTC para consistencia

#### `actualizarTurno()` (líneas 616-751)
- Recalcula la fecha cuando se cambia el turno manualmente
- Verifica conflictos de clave única
- Usa UTC para las fechas

### 3. `src/app/(principal)/dashboard/produccion/produccion-dia-lista.tsx`
Componente de UI para mostrar y editar producciones:

#### `formatearFechaUTC()` (líneas 49-55)
Formatea la fecha en UTC sin conversión de zona horaria:
```typescript
function formatearFechaUTC(fecha: Date): string {
  const dia = fecha.getUTCDate()
  const mes = fecha.getUTCMonth() + 1
  const anio = fecha.getUTCFullYear()
  return `${dia.toString().padStart(2, '0')}/${mes.toString().padStart(2, '0')}/${anio}`
}
```

#### `calcularFechaSegunTurno()` (líneas 57-80)
Calcula la fecha que se asignará según el turno seleccionado:
```typescript
function calcularFechaSegunTurno(turno: Turno): Date {
  const ahora = new Date()
  const hora = ahora.getHours()

  const hoy = new Date(Date.UTC(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
    0, 0, 0, 0
  ))

  if (turno === 'noche') {
    if (hora >= 4) {
      const manana = new Date(hoy)
      manana.setUTCDate(manana.getUTCDate() + 1)
      return manana
    }
  }
  return hoy
}
```

## Manejo de Zonas Horarias (IMPORTANTE)

### Por qué usamos UTC

Las fechas se almacenan en la base de datos como UTC medianoche (`2025-11-21T00:00:00.000Z`). Si usamos la hora local para crear fechas, hay inconsistencias porque:

- UTC medianoche en Honduras (GMT-6) = 6:00 PM del día anterior
- Esto causa que `toLocaleDateString()` muestre un día menos

### Solución implementada

1. **Guardar fechas en UTC**: Usar `Date.UTC()` para crear fechas
2. **Buscar por UTC**: Las consultas usan fechas UTC
3. **Mostrar en UTC**: Usar `getUTCDate()`, `getUTCMonth()`, `getUTCFullYear()`

### Código para crear fecha UTC

```typescript
const hoy = new Date(Date.UTC(
  ahora.getFullYear(),
  ahora.getMonth(),
  ahora.getDate(),
  0, 0, 0, 0
))
```

### Código para sumar días en UTC

```typescript
const manana = new Date(hoy)
manana.setUTCDate(manana.getUTCDate() + 1)
```

## Flujo de Actualización de Turno

1. Usuario selecciona nuevo turno en el selector
2. El diálogo muestra la fecha calculada según el turno seleccionado
3. Al hacer clic en "Confirmar Firma":
   - Si el turno cambió, primero se actualiza el turno y la fecha
   - Luego se firma la producción
4. La página se recarga con los nuevos datos

## Validaciones

### Al actualizar turno
- Verifica que no exista otra producción con la misma fecha/producto/turno
- No permite cambiar turno de producciones ya confirmadas en bodega

### Al firmar
- Solo permite firmar producciones de ayer, hoy o mañana
- No permite firmar producciones ya firmadas

## Troubleshooting

### La fecha muestra un día menos
**Causa**: Se está usando `toLocaleDateString()` que convierte UTC a hora local
**Solución**: Usar `formatearFechaUTC()` o los métodos `getUTCDate()`, `getUTCMonth()`, `getUTCFullYear()`

### Las producciones no aparecen en la lista
**Causa**: Las fechas de búsqueda no coinciden con las guardadas
**Solución**: Verificar que ambas usen UTC (00:00:00.000Z)

### Error al actualizar turno
**Causa**: Ya existe una producción con esa fecha/producto/turno
**Solución**: El sistema muestra un mensaje indicando el conflicto

### Firma Producción/Bodega muestra "Sin información"
**Causa**: El ID de usuario en la sesión no existe en la base de datos (común después de reiniciar el seed)
**Solución**: Cerrar sesión y volver a iniciar sesión para obtener el nuevo ID de usuario

### Error "Foreign key constraint violated: audit_logs_usuario_id_fkey"
**Causa**: El usuario actual no existe en la base de datos
**Solución**: Cerrar sesión e iniciar sesión nuevamente

## Archivos de Bodega

### `src/app/(principal)/dashboard/bodega/page.tsx`
Página principal de bodega que muestra:
- Pestaña "Pendientes": Productos firmados por producción esperando confirmación
- Pestaña "Historial": Productos ya confirmados con firmas

### `src/app/(principal)/dashboard/bodega/productos-bodega.tsx`
Componente que muestra los productos pendientes de confirmación:
- Botón "CONFIRMAR Y FIRMAR RECEPCIÓN" para cada producto
- Diálogo de confirmación con resumen del producto
- Usa `formatearFechaLargaUTC()` para mostrar fechas correctamente

```typescript
// Función para formatear fecha UTC sin conversión de zona horaria
function formatearFechaLargaUTC(fecha: Date): string {
  const diasSemana = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

  const d = new Date(fecha)
  const diaSemana = diasSemana[d.getUTCDay()]
  const dia = d.getUTCDate()
  const mes = meses[d.getUTCMonth()]
  const anio = d.getUTCFullYear()

  return `${diaSemana}, ${dia} de ${mes} de ${anio}`
}
```

### `src/app/(principal)/dashboard/bodega/historial-bodega.tsx`
Componente que muestra el historial de productos confirmados:
- Muestra firma de producción (quién firmó y cuándo)
- Muestra firma de bodega (quién confirmó y cuándo)
- Usa `formatearFechaCorta()` para fechas en formato corto

```typescript
function formatearFechaCorta(fecha: Date): string {
  const diasSemana = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb']
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

  const d = new Date(fecha)
  const diaSemana = diasSemana[d.getUTCDay()]
  const dia = d.getUTCDate()
  const mes = meses[d.getUTCMonth()]
  const anio = d.getUTCFullYear()

  return `${diaSemana}, ${dia} ${mes} ${anio}`
}
```

## Funciones de Bodega en acciones.ts

### `obtenerProductosFirmados()` (líneas 294-365)
Obtiene productos firmados por producción esperando confirmación de bodega:
- Busca en fechas: ayer, hoy, mañana (UTC)
- Filtra por `enviado: true` y `confirmadoPor: null`
- Incluye datos del usuario que firmó

### `obtenerHistorialBodega()` (líneas 368-424)
Obtiene historial de productos confirmados:
- Filtra por `confirmadoPor: { not: null }`
- Incluye datos de `usuarioFirma` y `usuarioConfirmacion`
- Últimos 50 registros

### `confirmarRecepcionBodega()` (líneas 545-640)
Confirma recepción de un producto en bodega:
- Valida permisos `BODEGA_CONFIRMAR`
- Valida que la producción esté firmada
- Guarda `confirmadoPor` y `fechaConfirmacion`

## Modelo de Datos

```prisma
model ProduccionDiaria {
  id                    String   @id @default(cuid())
  fecha                 DateTime
  productoId            String
  cantidadContenedores  Int
  unidadesPorContenedor Int
  totalUnidades         Int
  observaciones         String?
  turno                 String   @default("manana")
  enviado               Boolean  @default(false)
  firmadoPor            Int?
  fechaFirma            DateTime?
  confirmadoPor         Int?
  fechaConfirmacion     DateTime?

  @@unique([fecha, productoId, turno])
}
```

La restricción `@@unique([fecha, productoId, turno])` asegura que solo haya una producción por producto/fecha/turno.

## Integración Bodega → Inventario

### Descripción del Flujo

Cuando bodega confirma la recepción de un producto, automáticamente se registra en el inventario de la sucursal seleccionada:

1. **Producción firma** → El producto queda en estado "enviado"
2. **Bodega recibe** → Selecciona sucursal destino y confirma
3. **Inventario actualizado** → Se incrementa el stock automáticamente

### Función `confirmarRecepcionBodega()` (líneas 549-700+)

La función ahora acepta un parámetro `sucursalId` opcional:

```typescript
export async function confirmarRecepcionBodega(id: string, sucursalId?: string)
```

#### Lógica de Inventario

1. **Busca o crea inventario**: Si no existe registro de inventario para ese producto en esa sucursal, lo crea con cantidad 0
2. **Incrementa cantidad**: Suma las unidades producidas al inventario existente
3. **Registra movimiento**: Crea un `MovimientoInventario` de tipo "entrada" con el detalle de la producción

```typescript
// Buscar o crear inventario
let inventario = await prisma.inventario.findUnique({
  where: {
    sucursalId_productoId: { sucursalId, productoId },
  },
})

if (!inventario) {
  inventario = await prisma.inventario.create({
    data: {
      sucursalId,
      productoId,
      cantidadActual: 0,
      stockMinimo: 10,
    },
  })
}

// Actualizar cantidad y registrar movimiento (transacción)
await prisma.$transaction(async (tx) => {
  await tx.inventario.update({
    where: { id: inventario.id },
    data: {
      cantidadActual: { increment: totalUnidades },
    },
  })

  await tx.movimientoInventario.create({
    data: {
      inventarioId: inventario.id,
      productoId,
      tipo: 'entrada',
      cantidad: totalUnidades,
      motivo: `Entrada desde producción - Turno ${turno} - ${fecha}`,
      creadorId: usuarioId,
    },
  })
})
```

### Componentes de UI

#### `productos-bodega.tsx`

- Agregado selector de sucursal destino en el diálogo de confirmación
- Estado local para `sucursalId`
- Validación de que se seleccione una sucursal antes de confirmar

```typescript
type Props = {
  productos: ProductoFirmado[]
  usuario: { nombre: string; correo: string }
  sucursales: Sucursal[]  // Nuevo prop
}

// En el componente
const [sucursalId, setSucursalId] = useState<string>(sucursales[0]?.id || '')

const handleConfirmar = async () => {
  if (!sucursalId) {
    alert('Selecciona una sucursal destino')
    return
  }
  const result = await confirmarRecepcionBodega(producto.id, sucursalId)
  // ...
}
```

#### `page.tsx` (Bodega)

- Importa `obtenerSucursales` de inventario
- Pasa las sucursales al componente `ProductosBodega`

```typescript
import { obtenerSucursales } from '@/caracteristicas/inventario/acciones'

const [resultPendientes, resultHistorial, resultSucursales] = await Promise.all([
  obtenerProductosFirmados(),
  obtenerHistorialBodega(),
  obtenerSucursales()
])

<ProductosBodega
  productos={resultPendientes.productos || []}
  usuario={{...}}
  sucursales={resultSucursales.sucursales || []}
/>
```

### Modelo MovimientoInventario

```prisma
model MovimientoInventario {
  id           String     @id @default(cuid())
  inventarioId String
  productoId   String
  tipo         String     // 'entrada' | 'salida' | 'ajuste'
  cantidad     Int
  motivo       String?
  creadorId    Int
  creado_at    DateTime   @default(now())

  inventario   Inventario @relation(...)
  producto     Producto   @relation(...)
  creador      Usuario    @relation(...)
}
```

### Troubleshooting Inventario

#### El inventario no se actualiza
**Causa**: No se seleccionó una sucursal destino
**Solución**: Verificar que el selector tenga un valor antes de confirmar

#### Error "sucursalId_productoId not unique"
**Causa**: Intento de crear inventario duplicado
**Solución**: La función ya maneja esto buscando primero si existe

#### El movimiento no aparece en historial
**Causa**: Error en la transacción de movimiento
**Solución**: Verificar logs del servidor por errores de inventario
