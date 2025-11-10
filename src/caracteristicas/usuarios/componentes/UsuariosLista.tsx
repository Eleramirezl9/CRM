/**
 * Componente Lista de Usuarios
 * Muestra todos los usuarios con opciones de editar/desactivar
 */

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
import { Edit, ShieldAlert, CheckCircle, XCircle, Shield } from 'lucide-react'
import Link from 'next/link'
import { ToggleUsuarioActivo } from './ToggleUsuarioActivo'
import { requireRole } from '@/compartido/lib/dal'
import { requirePermiso, PERMISOS } from '@/compartido/lib/permisos'
import { UsuarioRepository } from '../repositorio'

export async function UsuariosLista() {
  try {
    // ✅ CRÍTICO: Validación de sesión y permisos
    await requireRole(['administrador'])
    await requirePermiso(PERMISOS.USUARIOS_VER)

    // ✅ Usar repositorio en lugar de Prisma directo
    const usuarioRepo = new UsuarioRepository()
    const usuarios = await usuarioRepo.findAll()

    // Verificar si hay usuarios
    if (!usuarios || usuarios.length === 0) {
      return (
        <div className="bg-white rounded-lg border p-8 text-center text-muted-foreground">
          No hay usuarios registrados en el sistema
        </div>
      )
    }

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
                  <div className="flex items-center gap-2">
                    <Badge variant={usuario.rol.nombre === 'administrador' ? 'destructive' : 'secondary'}>
                      {usuario.rol.nombre}
                    </Badge>
                    <Link href={`/dashboard/roles/${usuario.rol.id}/permisos`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        title="Ver permisos del rol"
                        aria-label={`Ver permisos del rol ${usuario.rol.nombre}`}
                      >
                        <Shield className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
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
                    <Link href={`/dashboard/usuarios/${usuario.id}/permisos`}>
                      <Button
                        variant="outline"
                        size="sm"
                        aria-label={`Gestionar permisos de ${usuario.nombre}`}
                        title="Gestionar permisos"
                      >
                        <Shield className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Link href={`/dashboard/usuarios/${usuario.id}/editar`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Editar usuario ${usuario.nombre}`}
                        title="Editar usuario"
                      >
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
  } catch (error) {
    console.error('Error al cargar usuarios:', error)

    // Si es error de permisos, mostrar mensaje específico
    if (error instanceof Error && error.message.includes('permiso')) {
      return (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg p-6">
          <h3 className="font-semibold">Acceso Denegado</h3>
          <p className="text-sm mt-1">{error.message}</p>
        </div>
      )
    }

    // Error genérico
    return (
      <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-6">
        <h3 className="font-semibold">Error al cargar usuarios</h3>
        <p className="text-sm mt-1">
          Ocurrió un problema al cargar la lista de usuarios. Por favor, intenta nuevamente.
        </p>
      </div>
    )
  }
}
