/**
 * Componente de Gestión de Permisos
 * ✅ Permite asignar/revocar permisos a roles
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/compartido/componentes/ui/button'
import { ArrowLeft, Save, Check } from 'lucide-react'
import Link from 'next/link'
import type { Permission } from '@prisma/client'
import { asignarPermisosRol } from '../acciones'

interface GestionPermisosProps {
  rolId: number
  permisos: Permission[]
  permisosActuales: number[]
}

export function GestionPermisos({
  rolId,
  permisos,
  permisosActuales,
}: GestionPermisosProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedPermisos, setSelectedPermisos] = useState<Set<number>>(
    new Set(permisosActuales)
  )
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Agrupar permisos por módulo
  const permisosPorModulo = permisos.reduce((acc, permiso) => {
    if (!acc[permiso.modulo]) {
      acc[permiso.modulo] = []
    }
    acc[permiso.modulo].push(permiso)
    return acc
  }, {} as Record<string, Permission[]>)

  const togglePermiso = (permisoId: number) => {
    const newSelected = new Set(selectedPermisos)
    if (newSelected.has(permisoId)) {
      newSelected.delete(permisoId)
    } else {
      newSelected.add(permisoId)
    }
    setSelectedPermisos(newSelected)
    setSuccess(false)
  }

  const toggleModulo = (modulo: string) => {
    const permisosDelModulo = permisosPorModulo[modulo]
    const todosSeleccionados = permisosDelModulo.every(p => selectedPermisos.has(p.id))

    const newSelected = new Set(selectedPermisos)

    if (todosSeleccionados) {
      // Deseleccionar todos del módulo
      permisosDelModulo.forEach(p => newSelected.delete(p.id))
    } else {
      // Seleccionar todos del módulo
      permisosDelModulo.forEach(p => newSelected.add(p.id))
    }

    setSelectedPermisos(newSelected)
    setSuccess(false)
  }

  const handleGuardar = () => {
    setError(null)
    setSuccess(false)

    startTransition(async () => {
      const result = await asignarPermisosRol(rolId, Array.from(selectedPermisos))

      if (!result.success) {
        setError(result.error || 'Error al guardar permisos')
      } else {
        setSuccess(true)
        router.refresh()
        setTimeout(() => setSuccess(false), 3000)
      }
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-md p-4 flex items-center gap-2">
          <Check className="w-5 h-5" />
          Permisos actualizados correctamente
        </div>
      )}

      <div className="bg-white p-6 rounded-lg border space-y-6">
        <div className="flex items-center justify-between border-b pb-4">
          <div>
            <h2 className="text-lg font-semibold">Permisos Disponibles</h2>
            <p className="text-sm text-muted-foreground">
              {selectedPermisos.size} de {permisos.length} seleccionados
            </p>
          </div>
        </div>

        <div className="space-y-6">
          {Object.entries(permisosPorModulo).map(([modulo, permisosModulo]) => {
            const todosSeleccionados = permisosModulo.every(p => selectedPermisos.has(p.id))
            const algunoSeleccionado = permisosModulo.some(p => selectedPermisos.has(p.id))

            return (
              <div key={modulo} className="space-y-3">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleModulo(modulo)}
                    disabled={isPending}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                      todosSeleccionados
                        ? 'bg-blue-600 border-blue-600'
                        : algunoSeleccionado
                        ? 'bg-blue-300 border-blue-600'
                        : 'border-gray-300 hover:border-blue-400'
                    } disabled:opacity-50`}
                  >
                    {todosSeleccionados && <Check className="w-4 h-4 text-white" />}
                    {algunoSeleccionado && !todosSeleccionados && (
                      <div className="w-2 h-2 bg-blue-600 rounded-sm" />
                    )}
                  </button>
                  <h3 className="font-semibold text-base capitalize">{modulo}</h3>
                  <span className="text-sm text-muted-foreground">
                    ({permisosModulo.filter(p => selectedPermisos.has(p.id)).length}/{permisosModulo.length})
                  </span>
                </div>

                <div className="ml-7 grid grid-cols-1 md:grid-cols-2 gap-3">
                  {permisosModulo.map((permiso) => (
                    <label
                      key={permiso.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedPermisos.has(permiso.id)
                          ? 'bg-blue-50 border-blue-200'
                          : 'hover:bg-gray-50 border-gray-200'
                      } ${isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedPermisos.has(permiso.id)}
                        onChange={() => togglePermiso(permiso.id)}
                        disabled={isPending}
                        className="mt-1 w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{permiso.nombre}</div>
                        {permiso.descripcion && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {permiso.descripcion}
                          </div>
                        )}
                        <div className="text-xs text-gray-500 mt-1 font-mono">
                          {permiso.codigo}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Link href="/dashboard/usuarios">
          <Button type="button" variant="ghost" disabled={isPending}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>
        </Link>
        <Button onClick={handleGuardar} disabled={isPending}>
          {isPending ? (
            'Guardando...'
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Guardar Permisos
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
