'use client'

import { useState, useEffect } from 'react'
import { obtenerSucursales } from '@/caracteristicas/inventario/acciones'

/**
 * Hook simple para obtener sucursales sin cache global.
 * Confía en el cache de Next.js para las Server Actions.
 */
export function useSucursales() {
  const [sucursales, setSucursales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    obtenerSucursales().then(result => {
      if (mounted && result.success && result.sucursales) {
        setSucursales(result.sucursales)
        setLoading(false)
      }
    }).catch(() => {
      if (mounted) {
        setLoading(false)
      }
    })

    return () => {
      mounted = false
    }
  }, [])

  return { sucursales, loading }
}
