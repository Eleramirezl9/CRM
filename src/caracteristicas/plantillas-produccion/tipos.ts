import type { PlantillaProduccion, PlantillaProduccionItem, Producto } from '@prisma/client'

/**
 * Plantilla con sus items y productos relacionados
 */
export type PlantillaConItems = PlantillaProduccion & {
  items: (PlantillaProduccionItem & {
    producto: Producto
  })[]
}

/**
 * Información básica de una plantilla para listados
 */
export type PlantillaResumen = {
  id: string
  nombre: string
  diaSemana: number
  descripcion: string | null
  color: string | null
  cantidadProductos: number
}

/**
 * Exportar tipos de schemas
 */
export type {
  CrearPlantillaInput,
  EditarPlantillaInput,
  AplicarPlantillaInput,
  ObtenerPlantillasPorDiaInput
} from './schemas'
