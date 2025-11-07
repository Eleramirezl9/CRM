/**
 * Página de Gestión de Usuarios
 * ✅ Solo accesible para administradores
 * ✅ CRUD completo de usuarios
 * ✅ Asignación de roles
 * ✅ Activar/Desactivar usuarios
 */

import { Suspense } from 'react'
import { requireRole } from '@/compartido/lib/dal'
import { UsuariosLista } from '@/caracteristicas/usuarios/componentes/UsuariosLista'
import { Button } from '@/compartido/componentes/ui/button'
import { Plus } from 'lucide-react'
import Link from 'next/link'

export default async function UsuariosPage() {
  // ✅ Validación de rol en el servidor
  await requireRole(['administrador'])

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Gestión de Usuarios</h1>
          <p className="text-muted-foreground mt-1">
            Administra los usuarios y sus roles en el sistema
          </p>
        </div>
        <Link href="/dashboard/usuarios/nuevo">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Usuario
          </Button>
        </Link>
      </div>

      <Suspense fallback={<div className="text-center py-12">Cargando usuarios...</div>}>
        <UsuariosLista />
      </Suspense>
    </div>
  )
}
