/**
 * Formulario de Usuario
 * ✅ Validación con Zod
 * ✅ Client Component con Server Actions
 */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/compartido/componentes/ui/button'
import { Input } from '@/compartido/componentes/ui/input'
import { Label } from '@/compartido/componentes/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/compartido/componentes/ui/select'
import { crearUsuario, actualizarUsuario } from '../acciones'
import type { Role, Sucursal } from '@prisma/client'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'

interface FormularioUsuarioProps {
  roles: Role[]
  sucursales: Pick<Sucursal, 'id' | 'nombre'>[]
  usuario?: {
    id: number
    nombre: string
    correo: string
    rolId: number
    sucursalId?: string | null
  }
}

export function FormularioUsuario({
  roles,
  sucursales,
  usuario,
}: FormularioUsuarioProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setErrors({})

    const formData = new FormData(e.currentTarget)
    const password = formData.get('password') as string

    const data = {
      nombre: formData.get('nombre') as string,
      correo: formData.get('correo') as string,
      ...(password && { password }), // Solo incluir password si tiene valor
      rolId: parseInt(formData.get('rolId') as string),
    }

    startTransition(async () => {
      let result

      if (usuario) {
        // Modo edición
        result = await actualizarUsuario(usuario.id, data)
      } else {
        // Modo creación
        result = await crearUsuario(data)
      }

      if (!result.success) {
        // Mostrar errores por campo si existen, sino error general
        if (result.fieldErrors) {
          const formattedErrors: Record<string, string> = {}
          for (const [key, messages] of Object.entries(result.fieldErrors)) {
            formattedErrors[key] = Array.isArray(messages) ? messages.join(', ') : messages
          }
          setErrors(formattedErrors)
        } else {
          setErrors({ general: result.error || 'Error al guardar usuario' })
        }
      } else {
        router.push('/dashboard/usuarios')
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-lg border">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 text-red-800 rounded-md p-4">
          {errors.general}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="nombre">Nombre Completo *</Label>
        <Input
          id="nombre"
          name="nombre"
          placeholder="Juan Pérez"
          required
          defaultValue={usuario?.nombre}
          disabled={isPending}
          className={errors.nombre ? 'border-red-500' : ''}
        />
        {errors.nombre && (
          <p className="text-sm text-red-600">{errors.nombre}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="correo">Correo Electrónico *</Label>
        <Input
          id="correo"
          name="correo"
          type="email"
          placeholder="usuario@empresa.com"
          required
          defaultValue={usuario?.correo}
          disabled={isPending}
          className={errors.correo ? 'border-red-500' : ''}
        />
        {errors.correo && (
          <p className="text-sm text-red-600">{errors.correo}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">
          Contraseña {!usuario && '*'}
        </Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder={usuario ? 'Dejar vacío para mantener actual' : 'Mínimo 8 caracteres'}
          required={!usuario}
          disabled={isPending}
          className={errors.password ? 'border-red-500' : ''}
        />
        {errors.password ? (
          <p className="text-sm text-red-600">{errors.password}</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Debe tener mínimo 8 caracteres, incluir mayúsculas, minúsculas, números y caracteres especiales
          </p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="rolId">Rol *</Label>
        <Select name="rolId" required defaultValue={usuario?.rolId.toString()} disabled={isPending}>
          <SelectTrigger>
            <SelectValue placeholder="Selecciona un rol" />
          </SelectTrigger>
          <SelectContent>
            {roles.map((rol) => (
              <SelectItem key={rol.id} value={rol.id.toString()}>
                {rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center justify-between pt-4 border-t">
        <Link href="/dashboard/usuarios">
          <Button type="button" variant="ghost" disabled={isPending}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
        </Link>
        <Button type="submit" disabled={isPending}>
          {isPending ? (
            'Guardando...'
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              {usuario ? 'Actualizar' : 'Crear'} Usuario
            </>
          )}
        </Button>
      </div>
    </form>
  )
}
