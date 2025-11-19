'use client'

import { useEffect, useState } from 'react'

/**
 * Componente para formatear fechas del lado del cliente
 * Evita errores de hidratación cuando se usan locales
 */
export function FechaFormateada({
  fecha,
  className
}: {
  fecha: Date | string
  className?: string
}) {
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  const fechaObj = typeof fecha === 'string' ? new Date(fecha) : fecha

  // Durante SSR y la primera renderización, mostrar formato ISO
  if (!montado) {
    return <span className={className}>{fechaObj.toISOString()}</span>
  }

  // Una vez montado en el cliente, formatear con locale
  return <span className={className}>{fechaObj.toLocaleString()}</span>
}
