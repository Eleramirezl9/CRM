/**
 * Componente para Gestionar Permisos Individuales de Usuario
 * Permite al administrador asignar/remover permisos específicos a un usuario
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/compartido/componentes/ui/button'
import { Checkbox } from '@/compartido/componentes/ui/checkbox'
import { Label } from '@/compartido/componentes/ui/label'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/compartido/componentes/ui/card'
import { Badge } from '@/compartido/componentes/ui/badge'
import { ArrowLeft, Save, Shield, AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { asignarPermisosUsuario } from '../acciones'

// Tipo para el resultado de la acción
interface ActionResult {
  success: boolean
  error?: string
  message?: string
}

interface Permission {
  id: number
  codigo: string
  nombre: string
  descripcion: string | null
  modulo: string
}

interface GestionarPermisosUsuarioProps {
  usuario: {
    id: number
    nombre: string
    correo: string
    rol: {
      id: number
      nombre: string
    }
  }
  todosPermisos: Permission[]
  permisosRol: number[] // IDs de permisos que vienen del rol
  permisosUsuario: number[] // IDs de permisos asignados individualmente
}

export function GestionarPermisosUsuario({
  usuario,
  todosPermisos,
  permisosRol,
  permisosUsuario,
}: GestionarPermisosUsuarioProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<number[]>(permisosUsuario)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Agrupar permisos por módulo
  const permisosPorModulo = todosPermisos.reduce((acc, permiso) => {
    if (!acc[permiso.modulo]) {
      acc[permiso.modulo] = []
    }
    acc[permiso.modulo].push(permiso)
    return acc
  }, {} as Record<string, Permission[]>)

  const handleToggle = (permisoId: number) => {
    setSelected((prev) =>
      prev.includes(permisoId)
        ? prev.filter((id) => id !== permisoId)
        : [...prev, permisoId]
    )
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    startTransition(async () => {
      const result = await asignarPermisosUsuario(usuario.id, selected)

      if (!result.success) {
        setError(result.error || 'Error al guardar permisos')
      } else {
        setSuccess(result.message || 'Permisos actualizados correctamente')
        setTimeout(() => {
          router.push('/dashboard/usuarios')
          router.refresh()
        }, 3000)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Información del Usuario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gestionar Permisos de Usuario</CardTitle>
              <CardDescription>
                Asigna permisos individuales que complementan o sobrescriben los permisos del rol
              </CardDescription>
            </div>
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Usuario</p>
              <p className="text-lg font-semibold">{usuario.nombre}</p>
              <p className="text-sm text-muted-foreground">{usuario.correo}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rol Asignado</p>
              <Badge variant="secondary" className="mt-1">
                {usuario.rol.nombre}
              </Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Permisos del Rol</p>
              <p className="text-sm text-muted-foreground mt-1">
                {permisosRol.length} permisos heredados del rol
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerta informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
        <div className="flex-1">
          <h4 className="font-medium text-blue-900">Cómo funcionan los permisos individuales</h4>
          <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
            <li>Los permisos marcados en <strong>azul</strong> vienen del rol del usuario (heredados)</li>
            <li>Puedes asignar permisos adicionales marcando las casillas</li>
            <li>Los permisos individuales se <strong>suman</strong> a los del rol</li>
            <li>El usuario tendrá acceso a todos los permisos marcados (rol + individuales)</li>
          </ul>
        </div>
      </div>

      {/* Mensajes de error/éxito */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4">
          {success}
        </div>
      )}

      {/* Formulario de permisos */}
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {Object.entries(permisosPorModulo).map(([modulo, permisos]) => (
            <Card key={modulo}>
              <CardHeader>
                <CardTitle className="text-lg capitalize">{modulo}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {permisos.map((permiso) => {
                    const vieneDelRol = permisosRol.includes(permiso.id)
                    const seleccionado = selected.includes(permiso.id)

                    return (
                      <div
                        key={permiso.id}
                        className={`flex items-start space-x-3 p-3 rounded-lg border ${
                          vieneDelRol
                            ? 'bg-blue-50 border-blue-200'
                            : seleccionado
                            ? 'bg-gray-50 border-gray-300'
                            : 'border-gray-200'
                        }`}
                      >
                        <Checkbox
                          id={`permiso-${permiso.id}`}
                          checked={seleccionado}
                          onCheckedChange={() => handleToggle(permiso.id)}
                          disabled={isPending}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <Label
                            htmlFor={`permiso-${permiso.id}`}
                            className="font-medium cursor-pointer flex items-center gap-2"
                          >
                            {permiso.nombre}
                            {vieneDelRol && (
                              <Badge variant="outline" className="text-xs bg-blue-100">
                                Del Rol
                              </Badge>
                            )}
                          </Label>
                          {permiso.descripcion && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {permiso.descripcion}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            Código: {permiso.codigo}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-between pt-6 border-t mt-6">
          <Link href="/dashboard/usuarios">
            <Button type="button" variant="ghost" disabled={isPending}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Usuarios
            </Button>
          </Link>

          <div className="flex items-center gap-3">
            <p className="text-sm text-muted-foreground">
              {selected.length} permiso{selected.length !== 1 ? 's' : ''} individual
              {selected.length !== 1 ? 'es' : ''} seleccionado{selected.length !== 1 ? 's' : ''}
            </p>
            <Button type="submit" disabled={isPending}>
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
      </form>
    </div>
  )
}
