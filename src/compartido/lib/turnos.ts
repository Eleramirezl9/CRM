/**
 * Utilidades para manejo de turnos de producción
 * Turno Mañana: 4:00 AM - 4:00 PM (04:00 - 16:00)
 * Turno Noche: 5:00 PM - 3:00 AM (17:00 - 03:00)
 */

export type Turno = 'manana' | 'noche'

/**
 * Detecta el turno actual basado en la hora
 * @param fecha - Fecha a evaluar (por defecto: ahora)
 * @returns 'manana' o 'noche'
 */
export function detectarTurno(fecha: Date = new Date()): Turno {
  const hora = fecha.getHours()

  // Turno mañana: 4:00 AM (04:00) hasta 4:00 PM (16:00)
  // Turno noche: 5:00 PM (17:00) hasta 3:00 AM (03:00)

  if (hora >= 4 && hora < 17) {
    return 'manana'
  } else {
    return 'noche'
  }
}

/**
 * Obtiene el label del turno para mostrar en UI
 */
export function getTurnoLabel(turno: Turno): string {
  return turno === 'manana' ? 'Mañana' : 'Noche'
}

/**
 * Obtiene el rango de horas del turno
 */
export function getTurnoHorario(turno: Turno): string {
  return turno === 'manana'
    ? '4:00 AM - 4:00 PM'
    : '5:00 PM - 3:00 AM'
}

/**
 * Obtiene información completa del turno
 */
export function getTurnoInfo(turno: Turno) {
  return {
    tipo: turno,
    label: getTurnoLabel(turno),
    horario: getTurnoHorario(turno),
  }
}
