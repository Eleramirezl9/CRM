/**
 * Componente Lista de Usuarios
 * Muestra todos los usuarios con opciones de editar/desactivar
 */

import { prisma } from '@/lib/prisma'
import { Badge } from '@/compartido/componentes/ui/badge'
import { Button } from '@/compartido/componentes/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/compartido/componentes/ui/table'
import { Edit, ShieldAlert, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'
import { ToggleUsuarioActivo } from './ToggleUsuarioActivo'

export async function UsuariosLista() {
  const usuarios = await prisma.usuario.findMany({
    include: {
      rol: true,
      sucursalGerente: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <div className="bg-white rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Correo</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Sucursal</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Intentos Fallidos</TableHead>
            <TableHead>Último Acceso</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map((usuario) => (
            <TableRow key={usuario.id}>
              <TableCell className="font-medium">{usuario.nombre}</TableCell>
              <TableCell>{usuario.correo}</TableCell>
              <TableCell>
                <Badge variant={usuario.rol.nombre === 'administrador' ? 'destructive' : 'secondary'}>
                  {usuario.rol.nombre}
                </Badge>
              </TableCell>
              <TableCell>
                {usuario.sucursalGerente?.nombre || (
                  <span className="text-muted-foreground">N/A</span>
                )}
              </TableCell>
              <TableCell>
                {usuario.activo ? (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-sm">Activo</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-red-600">
                    <XCircle className="w-4 h-4" />
                    <span className="text-sm">Inactivo</span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                {usuario.intentosFallidos > 0 ? (
                  <div className="flex items-center gap-2 text-amber-600">
                    <ShieldAlert className="w-4 h-4" />
                    <span className="text-sm font-medium">{usuario.intentosFallidos}</span>
                  </div>
                ) : (
                  <span className="text-muted-foreground">0</span>
                )}
              </TableCell>
              <TableCell>
                {usuario.ultimoAcceso ? (
                  <span className="text-sm">
                    {new Date(usuario.ultimoAcceso).toLocaleString('es-ES')}
                  </span>
                ) : (
                  <span className="text-muted-foreground">Nunca</span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Link href={`/dashboard/usuarios/${usuario.id}/editar`}>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <ToggleUsuarioActivo
                    usuarioId={usuario.id}
                    activo={usuario.activo}
                    nombreUsuario={usuario.nombre}
                  />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
