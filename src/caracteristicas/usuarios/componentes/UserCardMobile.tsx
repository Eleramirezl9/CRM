'use client'

import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/compartido/componentes/ui/card'
import { Edit, CheckCircle, XCircle, Shield, ShieldAlert } from 'lucide-react'
import Link from 'next/link'
import { ToggleUsuarioActivo } from './ToggleUsuarioActivo'

interface UserCardMobileProps {
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

export function UserCardMobile({ usuario }: UserCardMobileProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base font-semibold">{usuario.nombre}</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{usuario.correo}</p>
          </div>
          {usuario.activo ? (
            <div className="ml-2 flex-shrink-0">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
          ) : (
            <div className="ml-2 flex-shrink-0">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Rol */}
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Rol:</span>
          <Badge
            variant={usuario.rol.nombre === 'administrador' ? 'destructive' : 'secondary'}
            className="text-xs"
          >
            {usuario.rol.nombre}
          </Badge>
        </div>

        {/* Sucursal */}
        {usuario.sucursalGerente && (
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Sucursal:</span>
            <span className="text-xs font-medium text-slate-900">{usuario.sucursalGerente.nombre}</span>
          </div>
        )}

        {/* Intentos Fallidos */}
        {usuario.intentosFallidos > 0 && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-amber-50 rounded-md border border-amber-200">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            <span className="text-xs font-medium text-amber-700">
              {usuario.intentosFallidos} intento{usuario.intentosFallidos !== 1 ? 's' : ''} fallido{usuario.intentosFallidos !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Último Acceso */}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Último acceso:{' '}
            {usuario.ultimoAcceso ? (
              <span className="font-medium text-slate-700">
                {new Date(usuario.ultimoAcceso).toLocaleString('es-ES', {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </span>
            ) : (
              <span className="font-medium text-slate-700">Nunca</span>
            )}
          </p>
        </div>

        {/* Acciones */}
        <div className="flex gap-2 pt-2">
          <Link href={`/dashboard/usuarios/${usuario.id}/permisos`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs h-8">
              <Shield className="w-3 h-3 mr-1" />
              Permisos
            </Button>
          </Link>
          <Link href={`/dashboard/usuarios/${usuario.id}/editar`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs h-8">
              <Edit className="w-3 h-3 mr-1" />
              Editar
            </Button>
          </Link>
          <div className="flex-1">
            <ToggleUsuarioActivo
              usuarioId={usuario.id}
              activo={usuario.activo}
              nombreUsuario={usuario.nombre}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
