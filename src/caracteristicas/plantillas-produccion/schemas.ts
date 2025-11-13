import { z } from 'zod'

/**
 * Schema para crear una plantilla de producción
 */
export const crearPlantillaSchema = z.object({
  nombre: z.string()
    .min(3, 'El nombre debe tener al menos 3 caracteres')
    .max(100, 'El nombre no puede exceder 100 caracteres'),
  diaSemana: z.number()
    .int('Debe ser un número entero')
    .min(1, 'Día debe ser entre 1 (Lunes) y 7 (Domingo)')
    .max(7, 'Día debe ser entre 1 (Lunes) y 7 (Domingo)'),
  descripcion: z.string()
    .max(500, 'La descripción no puede exceder 500 caracteres')
    .optional(),
  color: z.string()
    .regex(/^#[0-9A-F]{6}$/i, 'Color debe ser un hexadecimal válido (ej: #FF5733)')
    .optional(),
  items: z.array(z.object({
    productoId: z.string().min(1, 'Producto es requerido'),
    cantidadContenedores: z.number()
      .int('Debe ser un número entero')
      .positive('Debe ser mayor a 0')
      .max(10000, 'Cantidad muy alta'),
    unidadesPorContenedor: z.number()
      .int('Debe ser un número entero')
      .positive('Debe ser mayor a 0')
      .max(1000, 'Cantidad muy alta'),
    orden: z.number().int().default(0)
  }))
  .min(1, 'Debe haber al menos un producto en la plantilla')
  .max(50, 'Máximo 50 productos por plantilla')
})

export type CrearPlantillaInput = z.infer<typeof crearPlantillaSchema>

/**
 * Schema para editar una plantilla de producción
 */
export const editarPlantillaSchema = crearPlantillaSchema.extend({
  id: z.string().min(1, 'ID es requerido')
})

export type EditarPlantillaInput = z.infer<typeof editarPlantillaSchema>

/**
 * Schema para aplicar plantilla a producción
 */
export const aplicarPlantillaSchema = z.object({
  plantillaId: z.string().min(1, 'ID de plantilla es requerido'),
  fecha: z.date().optional(),
  ajustes: z.array(z.object({
    productoId: z.string(),
    cantidadContenedores: z.number().int().positive(),
    unidadesPorContenedor: z.number().int().positive()
  })).optional() // Para permitir editar cantidades antes de aplicar
})

export type AplicarPlantillaInput = z.infer<typeof aplicarPlantillaSchema>

/**
 * Schema para obtener plantillas por día
 */
export const obtenerPlantillasPorDiaSchema = z.object({
  diaSemana: z.number()
    .int()
    .min(1)
    .max(7),
  activa: z.boolean().optional().default(true)
})

export type ObtenerPlantillasPorDiaInput = z.infer<typeof obtenerPlantillasPorDiaSchema>
