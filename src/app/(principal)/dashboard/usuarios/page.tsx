/**
 * Página de Gestión de Usuarios
 * ✅ Solo accesible para administradores
 * ✅ CRUD completo de usuarios
 * ✅ Asignación de roles
 * ✅ Activar/Desactivar usuarios
 */

import { Suspense } from 'react'
import { verificarPermiso, PERMISOS } from '@/compartido/lib/permisos'
import { NoAutorizado } from '@/compartido/componentes/NoAutorizado'
import { UsuariosLista } from '@/caracteristicas/usuarios/componentes/UsuariosLista'
import { UsuariosPageTitle } from './UsuariosPageTitle'
import { Button } from '@/compartido/componentes/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function UsuariosPage() {
  const tienePermiso = await verificarPermiso(PERMISOS.USUARIOS_VER)

  if (!tienePermiso) {
    return <NoAutorizado />
  }

  return (
    <div className="p-4 sm:p-8 space-y-6">
      {/* Header mejorado con título SVG */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <UsuariosPageTitle />
          <p className="text-muted-foreground mt-3 text-sm sm:text-base">
            Administra los usuarios y sus roles en el sistema
          </p>
        </div>
        <Link href="/dashboard/usuarios/nuevo" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto h-10 px-4 py-2">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>Cargando usuarios...</div>}>
        <UsuariosLista />
      </Suspense>
    </div>
  )
}
