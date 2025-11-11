'use client'

import { Button } from '@/compartido/componentes/ui/button'
import { RefreshCw } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useState } from 'react'

/**
 * Botón para refrescar permisos del usuario actual
 * Útil después de que un admin asigna nuevos permisos
 */
export function RefreshPermisosButton() {
  const { update } = useSession()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      // Forzar actualización de la sesión
      await update()

      // Recargar la página para aplicar los nuevos permisos
      setTimeout(() => {
        window.location.reload()
      }, 500)
    } catch (error) {
      console.error('Error al refrescar permisos:', error)
      alert('Error al refrescar permisos. Intenta recargar la página.')
      setIsRefreshing(false)
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleRefresh}
      disabled={isRefreshing}
      title="Refrescar permisos"
    >
      <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
      {isRefreshing ? 'Refrescando...' : 'Refrescar Permisos'}
    </Button>
  )
}
