import { isToday, isYesterday, startOfDay, differenceInDays, format } from 'date-fns'
import { es } from 'date-fns/locale'

/**
 * Agrupa elementos por día basándose en su fecha de creación
 * @param items - Array de items que contienen una propiedad createdAt
 * @returns Objeto con etiquetas de días como keys y arrays de items como values
 *
 * Etiquetas posibles:
 * - "Hoy" - Items creados hoy
 * - "Ayer" - Items creados ayer
 * - "Hace X días" - Items creados hace 2-7 días
 * - "dd de MMMM yyyy" - Items creados hace más de 7 días (fecha completa)
 */
export function agruparPorDia<T extends { createdAt: Date | string }>(
  items: T[]
): Record<string, T[]> {
  const grupos: Record<string, T[]> = {}
  const hoy = startOfDay(new Date())

  items.forEach(item => {
    // Validar y convertir fecha
    const fechaItem = new Date(item.createdAt)

    // Validación defensiva: verificar que sea una fecha válida
    if (isNaN(fechaItem.getTime())) {
      console.error('Fecha inválida detectada:', item)
      // Agrupar items con fecha inválida en categoría especial
      const etiqueta = 'Fecha inválida'
      if (!grupos[etiqueta]) {
        grupos[etiqueta] = []
      }
      grupos[etiqueta].push(item)
      return
    }

    let etiqueta: string

    if (isToday(fechaItem)) {
      etiqueta = 'Hoy'
    } else if (isYesterday(fechaItem)) {
      etiqueta = 'Ayer'
    } else {
      const diasDiferencia = differenceInDays(hoy, startOfDay(fechaItem))
      if (diasDiferencia <= 7) {
        etiqueta = `Hace ${diasDiferencia} días`
      } else {
        etiqueta = format(fechaItem, "dd 'de' MMMM yyyy", { locale: es })
      }
    }

    if (!grupos[etiqueta]) {
      grupos[etiqueta] = []
    }
    grupos[etiqueta].push(item)
  })

  return grupos
}
