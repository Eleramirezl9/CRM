/**
 * Componente Lista de Usuarios
 * Muestra todos los usuarios con opciones de editar/desactivar
 * ✅ Diseño mejorado y responsive
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
import { Edit, ShieldAlert, CheckCircle, XCircle, Shield, Users } from 'lucide-react'
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
        <div className="bg-white rounded-lg border p-8 text-center">
          <div className="flex flex-col items-center">
            <div className="rounded-full bg-slate-100 p-4 mb-3">
              <Users className="w-6 h-6 text-slate-500" />
            </div>
            <p className="text-muted-foreground font-medium">No hay usuarios registrados en el sistema</p>
          </div>
        </div>
      )
    }

    return (
      <>
        {/* Vista Mobile: Cards */}
        <div className="lg:hidden space-y-3">
          {usuarios.map((usuario) => (
            <div key={usuario.id} className="bg-white rounded-lg border p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-slate-900">{usuario.nombre}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{usuario.correo}</p>
                </div>
                {usuario.activo ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 ml-2" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 ml-2" />
                )}
              </div>

              <div className="space-y-2 mb-3 pb-3 border-b">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Rol:</span>
                  <Badge
                    variant={usuario.rol.nombre === 'administrador' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {usuario.rol.nombre}
                  </Badge>
                </div>

                {usuario.sucursalGerente && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sucursal:</span>
                    <span className="font-medium text-slate-900 text-xs">{usuario.sucursalGerente.nombre}</span>
                  </div>
                )}

                {usuario.intentosFallidos > 0 && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-amber-50 rounded text-amber-700 text-xs">
                    <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                    <span className="font-medium">{usuario.intentosFallidos} intento{usuario.intentosFallidos !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>

              <div className="text-xs text-muted-foreground mb-3">
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
              </div>

              <div className="grid grid-cols-3 gap-2">
                <Link href={`/dashboard/usuarios/${usuario.id}/permisos`}>
                  <Button variant="outline" size="sm" className="w-full text-xs h-8">
                    <Shield className="w-3 h-3 mr-1" />
                    Permisos
                  </Button>
                </Link>
                <Link href={`/dashboard/usuarios/${usuario.id}/editar`}>
                  <Button variant="outline" size="sm" className="w-full text-xs h-8">
                    <Edit className="w-3 h-3 mr-1" />
                    Editar
                  </Button>
                </Link>
                <ToggleUsuarioActivo
                  usuarioId={usuario.id}
                  activo={usuario.activo}
                  nombreUsuario={usuario.nombre}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Vista Desktop: Tabla */}
        <div className="hidden lg:block bg-white rounded-lg border shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="font-semibold text-slate-900">Nombre</TableHead>
                  <TableHead className="font-semibold text-slate-900">Correo</TableHead>
                  <TableHead className="font-semibold text-slate-900">Rol</TableHead>
                  <TableHead className="font-semibold text-slate-900">Sucursal</TableHead>
                  <TableHead className="font-semibold text-slate-900">Estado</TableHead>
                  <TableHead className="font-semibold text-slate-900">Intentos</TableHead>
                  <TableHead className="font-semibold text-slate-900">Último Acceso</TableHead>
                  <TableHead className="text-right font-semibold text-slate-900">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuarios.map((usuario, index) => (
                  <TableRow 
                    key={usuario.id} 
                    className={`transition-colors duration-150 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                    } hover:bg-blue-50`}
                  >
                    <TableCell className="font-medium text-slate-900">{usuario.nombre}</TableCell>
                    <TableCell className="text-slate-600 text-sm">{usuario.correo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={usuario.rol.nombre === 'administrador' ? 'destructive' : 'secondary'}
                          className="text-xs font-medium"
                        >
                          {usuario.rol.nombre}
                        </Badge>
                        <Link href={`/dashboard/roles/${usuario.rol.id}/permisos`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 hover:bg-slate-200"
                            title="Ver permisos del rol"
                            aria-label={`Ver permisos del rol ${usuario.rol.nombre}`}
                          >
                            <Shield className="w-3 h-3" />
                          </Button>
                        </Link>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">
                      {usuario.sucursalGerente?.nombre || (
                        <span className="text-muted-foreground italic">N/A</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {usuario.activo ? (
                        <div className="flex items-center gap-2 text-emerald-600 font-medium">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs sm:text-sm">Activo</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-red-600 font-medium">
                          <XCircle className="w-4 h-4" />
                          <span className="text-xs sm:text-sm">Inactivo</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {usuario.intentosFallidos > 0 ? (
                        <div className="flex items-center gap-2 bg-amber-50 px-2 py-1 rounded-md text-amber-700 font-medium text-xs w-fit">
                          <ShieldAlert className="w-3 h-3" />
                          <span>{usuario.intentosFallidos}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">0</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 text-xs sm:text-sm">
                      {usuario.ultimoAcceso ? (
                        <span className="font-medium">
                          {new Date(usuario.ultimoAcceso).toLocaleString('es-ES', {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic">Nunca</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link href={`/dashboard/usuarios/${usuario.id}/permisos`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-slate-200"
                            title="Gestionar permisos"
                            aria-label={`Gestionar permisos de ${usuario.nombre}`}
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Link href={`/dashboard/usuarios/${usuario.id}/editar`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-slate-200"
                            title="Editar usuario"
                            aria-label={`Editar usuario ${usuario.nombre}`}
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

          {/* Resumen al pie */}
          <div className="bg-slate-50 px-4 sm:px-6 py-3 border-t text-xs sm:text-sm text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <span className="font-medium">Total: <span className="text-slate-900 font-bold">{usuarios.length}</span> usuarios</span>
            <div className="flex flex-wrap gap-3">
              <span>Activos: <span className="text-emerald-600 font-bold">{usuarios.filter(u => u.activo).length}</span></span>
              <span>Inactivos: <span className="text-red-600 font-bold">{usuarios.filter(u => !u.activo).length}</span></span>
            </div>
          </div>
        </div>
      </>
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
