'use client'

import { useEffect, useState } from 'react'

/**
 * Componente para formatear números del lado del cliente
 * Evita errores de hidratación cuando se usan locales
 */
export function NumeroFormateado({
  valor,
  className
}: {
  valor: number
  className?: string
}) {
  const [montado, setMontado] = useState(false)

  useEffect(() => {
    setMontado(true)
  }, [])

  // Durante SSR y la primera renderización, mostrar sin formato
  if (!montado) {
    return <span className={className}>{valor}</span>
  }

  // Una vez montado en el cliente, formatear
  return <span className={className}>{valor.toLocaleString()}</span>
}
