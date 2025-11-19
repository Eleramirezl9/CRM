'use client'

import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/compartido/componentes/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/compartido/componentes/ui/dropdown-menu'
import {
  Edit,
  ShieldAlert,
  CheckCircle,
  XCircle,
  Shield,
  MoreVertical,
  Lock,
  Unlock,
  Pencil,
} from 'lucide-react'
import Link from 'next/link'
import { ToggleUsuarioActivo } from './ToggleUsuarioActivo'

interface UserCardProps {
  usuario: {
    id: number
    nombre: string
    correo: string
    rol: { id: number; nombre: string }
    sucursalGerente?: { nombre: string } | null
    activo: boolean
    intentosFallidos: number
    ultimoAcceso: Date | null
  }
}

export function UserCard({ usuario }: UserCardProps) {
  const getRolColor = (rolNombre: string) => {
    switch (rolNombre) {
      case 'administrador':
        return 'bg-red-100 text-red-800 hover:bg-red-200'
      case 'bodega':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-200'
      case 'sucursal':
        return 'bg-green-100 text-green-800 hover:bg-green-200'
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-200'
    }
  }

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{usuario.nombre}</CardTitle>
            <CardDescription className="text-xs mt-1">{usuario.correo}</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <Link href={`/dashboard/usuarios/${usuario.id}/editar`}>
                <DropdownMenuItem>
                  <Pencil className="mr-2 h-4 w-4" />
                  <span>Editar</span>
                </DropdownMenuItem>
              </Link>
              <Link href={`/dashboard/usuarios/${usuario.id}/permisos`}>
                <DropdownMenuItem>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Gestionar Permisos</span>
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="p-0">
                <div className="w-full px-2 py-1.5">
                  <ToggleUsuarioActivo
                    usuarioId={usuario.id as any}
                    activo={usuario.activo}
                    nombreUsuario={usuario.nombre}
                  />
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Rol */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Rol:</span>
          <Badge variant="outline" className={`text-xs ${getRolColor(usuario.rol.nombre)}`}>
            {usuario.rol.nombre}
          </Badge>
        </div>

        {/* Sucursal */}
        {usuario.sucursalGerente && (
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Sucursal:</span>
            <span className="text-sm font-medium">{usuario.sucursalGerente.nombre}</span>
          </div>
        )}

        {/* Estado */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Estado:</span>
          {usuario.activo ? (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Activo</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="w-4 h-4" />
              <span className="text-xs font-medium">Inactivo</span>
            </div>
          )}
        </div>

        {/* Intentos Fallidos */}
        {usuario.intentosFallidos > 0 && (
          <div className="flex items-center gap-2 px-2 py-1 bg-amber-50 rounded-md">
            <ShieldAlert className="w-4 h-4 text-amber-600" />
            <span className="text-xs font-medium text-amber-700">
              {usuario.intentosFallidos} intentos fallidos
            </span>
          </div>
        )}

        {/* Último Acceso */}
        <div className="text-xs text-muted-foreground pt-2 border-t">
          {usuario.ultimoAcceso ? (
            <span>
              Último acceso:{' '}
              <span className="font-medium">
                {new Date(usuario.ultimoAcceso).toLocaleString('es-ES')}
              </span>
            </span>
          ) : (
            <span className="text-muted-foreground">Nunca ha iniciado sesión</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
