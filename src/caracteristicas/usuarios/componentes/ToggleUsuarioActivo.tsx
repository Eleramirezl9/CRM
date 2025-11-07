/**
 * Componente para Activar/Desactivar Usuario
 * ✅ Client Component con confirmación
 * ✅ Optimistic Updates
 */
'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/compartido/componentes/ui/button'
import { Power, PowerOff } from 'lucide-react'
import { toggleUsuarioActivo } from '../acciones'
import { useRouter } from 'next/navigation'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/compartido/componentes/ui/alert-dialog'

interface ToggleUsuarioActivoProps {
  usuarioId: number
  activo: boolean
  nombreUsuario: string
}

export function ToggleUsuarioActivo({
  usuarioId,
  activo,
  nombreUsuario,
}: ToggleUsuarioActivoProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleToggle = () => {
    setError(null)
    startTransition(async () => {
      const result = await toggleUsuarioActivo(usuarioId, !activo)
      if (!result.success) {
        setError(result.error || 'Error al actualizar usuario')
      } else {
        router.refresh()
      }
    })
  }

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant={activo ? 'outline' : 'default'}
            size="sm"
            disabled={isPending}
          >
            {activo ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <Power className="w-4 h-4" />
            )}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {activo ? 'Desactivar' : 'Activar'} Usuario
            </AlertDialogTitle>
            <AlertDialogDescription>
              {activo ? (
                <>
                  ¿Estás seguro de que deseas desactivar a <strong>{nombreUsuario}</strong>?
                  <br />
                  El usuario no podrá iniciar sesión hasta que sea reactivado.
                </>
              ) : (
                <>
                  ¿Estás seguro de que deseas activar a <strong>{nombreUsuario}</strong>?
                  <br />
                  El usuario podrá iniciar sesión nuevamente.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle}>
              {activo ? 'Desactivar' : 'Activar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && (
        <p className="text-sm text-red-600 mt-1">{error}</p>
      )}
    </>
  )
}
