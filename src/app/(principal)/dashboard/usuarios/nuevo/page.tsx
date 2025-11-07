/**
 * Página de Creación de Usuario
 * ✅ Solo accesible para administradores
 */

import { requireRole } from '@/compartido/lib/dal'
import { FormularioUsuario } from '@/caracteristicas/usuarios/componentes/FormularioUsuario'
import { prisma } from '@/lib/prisma'

export default async function NuevoUsuarioPage() {
  // ✅ Validación de rol en el servidor
  await requireRole('administrador')

  // Cargar roles y sucursales disponibles
  const [roles, sucursales] = await Promise.all([
    prisma.role.findMany({
      orderBy: { nombre: 'asc' },
    }),
    prisma.sucursal.findMany({
      orderBy: { nombre: 'asc' },
      select: { id: true, nombre: true },
    }),
  ])

  return (
    <div className="p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Nuevo Usuario</h1>
        <p className="text-muted-foreground mt-1">
          Crea un nuevo usuario y asígnale un rol
        </p>
      </div>

      <FormularioUsuario roles={roles} sucursales={sucursales} />
    </div>
  )
}
