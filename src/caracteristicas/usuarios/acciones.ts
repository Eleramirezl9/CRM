/**
 * Server Actions para gestión de usuarios
 * ✅ Protegidas con DAL y validación de permisos
 * ✅ Validación con Zod
 * ✅ Auditoría completa
 */

'use server'

import { requireRole, getCurrentUserId } from '@/compartido/lib/dal'
import { requirePermiso, PERMISOS } from '@/compartido/lib/permisos'
import { registrarAuditoria } from '@/compartido/lib/auditoria'
import { checkRateLimit, getRateLimitResetMinutes } from '@/compartido/lib/rate-limit'
import { invalidarSesionUsuario } from '@/compartido/lib/invalidar-sesion'
import { UsuarioRepository } from './repositorio'
import {
  createUsuarioSchema,
  updateUsuarioSchema,
  changePasswordSchema,
  type CreateUsuarioInput,
  type UpdateUsuarioInput,
  type ChangePasswordInput,
} from './schemas'
import { revalidatePath } from 'next/cache'
import { ZodError } from 'zod'

const usuarioRepo = new UsuarioRepository()

interface ActionResult<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
  fieldErrors?: Record<string, string[]>
}

/**
 * Listar todos los usuarios
 * Solo administrador
 */
export async function listarUsuarios(): Promise<ActionResult> {
  try {
    await requireRole(['administrador'])
    await requirePermiso(PERMISOS.USUARIOS_VER)

    const usuarios = await usuarioRepo.findAll()

    return { success: true, data: usuarios }
  } catch (error) {
    console.error('Error al listar usuarios:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al listar usuarios',
    }
  }
}

/**
 * Obtener usuario por ID
 */
export async function obtenerUsuario(id: number): Promise<ActionResult> {
  try {
    await requireRole(['administrador'])
    await requirePermiso(PERMISOS.USUARIOS_VER)

    const usuario = await usuarioRepo.findById(id)

    if (!usuario) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    return { success: true, data: usuario }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al obtener usuario',
    }
  }
}

/**
 * Crear nuevo usuario
 * Solo administrador
 */
export async function crearUsuario(input: CreateUsuarioInput): Promise<ActionResult> {
  try {
    await requireRole(['administrador'])
    await requirePermiso(PERMISOS.USUARIOS_CREAR)

    // ✅ Rate Limiting - Prevenir creación masiva de usuarios
    const currentUserId = await getCurrentUserId()
    const rateLimitResult = checkRateLimit(`crear-usuario:${currentUserId}`, {
      windowMs: 15 * 60 * 1000, // 15 minutos
      max: 10, // 10 usuarios por ventana
    })

    if (!rateLimitResult.success) {
      const minutesRemaining = getRateLimitResetMinutes(rateLimitResult.resetTime)
      return {
        success: false,
        error: `Límite de creación de usuarios excedido. Intenta de nuevo en ${minutesRemaining} minutos.`,
      }
    }

    // Validar input
    const validated = createUsuarioSchema.parse(input)

    // Verificar que el email no exista
    const existingUser = await usuarioRepo.findByEmail(validated.correo)
    if (existingUser) {
      return { success: false, error: 'El correo electrónico ya está registrado' }
    }

    // Crear usuario
    const usuario = await usuarioRepo.create(validated)

    // Auditoría
    await registrarAuditoria({
      usuarioId: currentUserId,
      accion: 'CREATE_USER',
      entidad: 'Usuario',
      entidadId: String(usuario.id),
      detalles: {
        correo: usuario.correo,
        rol: usuario.rol.nombre,
      },
    })

    revalidatePath('/dashboard/usuarios')

    return { success: true, data: usuario }
  } catch (error) {
    console.error('Error al crear usuario:', error)

    if (error instanceof ZodError) {
      return {
        success: false,
        error: 'Error de validación',
        fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al crear usuario',
    }
  }
}

/**
 * Actualizar usuario existente
 * Solo administrador
 */
export async function actualizarUsuario(
  id: number,
  input: UpdateUsuarioInput
): Promise<ActionResult> {
  try {
    await requireRole(['administrador'])
    await requirePermiso(PERMISOS.USUARIOS_EDITAR)

    // Validar input
    const validated = updateUsuarioSchema.parse(input)

    // Verificar que el usuario existe
    const existingUser = await usuarioRepo.findById(id)
    if (!existingUser) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    // Si se cambia el email, verificar que no exista
    if (validated.correo && validated.correo !== existingUser.correo) {
      const emailExists = await usuarioRepo.findByEmail(validated.correo)
      if (emailExists) {
        return { success: false, error: 'El correo electrónico ya está registrado' }
      }
    }

    // Actualizar usuario
    const usuario = await usuarioRepo.update(id, validated)

    // Auditoría
    const currentUserId = await getCurrentUserId()
    await registrarAuditoria({
      usuarioId: currentUserId,
      accion: 'UPDATE_USER',
      entidad: 'Usuario',
      entidadId: String(id),
      detalles: {
        cambios: validated,
      },
    })

    revalidatePath('/dashboard/usuarios')
    revalidatePath(`/dashboard/usuarios/${id}`)

    return { success: true, data: usuario }
  } catch (error) {
    console.error('Error al actualizar usuario:', error)

    if (error instanceof ZodError) {
      return {
        success: false,
        error: 'Error de validación',
        fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar usuario',
    }
  }
}

/**
 * Cambiar contraseña de usuario
 */
export async function cambiarContrasena(
  usuarioId: number,
  input: ChangePasswordInput
): Promise<ActionResult> {
  try {
    const currentUserId = await getCurrentUserId()

    // Solo puede cambiar su propia contraseña o admin puede cambiar cualquiera
    const session = await requireRole(['administrador', 'bodega', 'sucursal', 'produccion'])
    if (session.user.rol !== 'administrador' && currentUserId !== usuarioId) {
      return { success: false, error: 'No tienes permiso para cambiar esta contraseña' }
    }

    // Validar input
    const validated = changePasswordSchema.parse(input)

    // Si no es admin, verificar contraseña actual
    if (session.user.rol !== 'administrador') {
      const { verify } = await import('@node-rs/argon2')
      const usuario = await usuarioRepo.findById(usuarioId)
      if (!usuario) {
        return { success: false, error: 'Usuario no encontrado' }
      }

      const isValid = await verify(usuario.contrasenaHash, validated.currentPassword)
      if (!isValid) {
        return { success: false, error: 'Contraseña actual incorrecta' }
      }
    }

    // Cambiar contraseña
    await usuarioRepo.changePassword(usuarioId, validated.newPassword)

    // Auditoría
    await registrarAuditoria({
      usuarioId: currentUserId,
      accion: 'CHANGE_PASSWORD',
      entidad: 'Usuario',
      entidadId: String(usuarioId),
      detalles: {
        cambiadoPorAdmin: session.user.rol === 'administrador',
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Error al cambiar contraseña:', error)

    if (error instanceof ZodError) {
      return {
        success: false,
        error: 'Error de validación',
        fieldErrors: error.flatten().fieldErrors as Record<string, string[]>,
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al cambiar contraseña',
    }
  }
}

/**
 * Activar/Desactivar usuario
 */
export async function toggleUsuarioActivo(id: number, activo: boolean): Promise<ActionResult> {
  try {
    await requireRole(['administrador'])
    await requirePermiso(PERMISOS.USUARIOS_EDITAR)

    if (activo) {
      await usuarioRepo.activate(id)
    } else {
      await usuarioRepo.deactivate(id)
    }

    // Auditoría
    const currentUserId = await getCurrentUserId()
    await registrarAuditoria({
      usuarioId: currentUserId,
      accion: 'UPDATE_USER',
      entidad: 'Usuario',
      entidadId: String(id),
      detalles: {
        accion: activo ? 'activado' : 'desactivado',
      },
    })

    revalidatePath('/dashboard/usuarios')

    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al actualizar usuario',
    }
  }
}

/**
 * Asignar permisos individuales a un usuario
 * Solo administrador
 */
export async function asignarPermisosUsuario(
  usuarioId: number,
  permissionIds: number[]
): Promise<ActionResult> {
  try {
    await requireRole(['administrador'])
    await requirePermiso(PERMISOS.USUARIOS_EDITAR)

    const { prisma } = await import('@/lib/prisma')

    // Verificar que el usuario existe
    const usuario = await usuarioRepo.findById(usuarioId)
    if (!usuario) {
      return { success: false, error: 'Usuario no encontrado' }
    }

    // Verificar que todos los permisos existen
    const permisosExistentes = await prisma.permission.findMany({
      where: {
        id: {
          in: permissionIds,
        },
      },
      select: { id: true },
    })

    if (permisosExistentes.length !== permissionIds.length) {
      return { success: false, error: 'Algunos permisos no existen' }
    }

    // Eliminar permisos actuales del usuario
    await prisma.userPermission.deleteMany({
      where: {
        usuarioId: usuarioId,
      },
    })

    // Asignar nuevos permisos
    if (permissionIds.length > 0) {
      await prisma.userPermission.createMany({
        data: permissionIds.map((permissionId) => ({
          usuarioId: usuarioId,
          permissionId,
        })),
      })
    }

    // Auditoría
    const currentUserId = await getCurrentUserId()
    await registrarAuditoria({
      usuarioId: currentUserId,
      accion: 'UPDATE_USER_PERMISSIONS',
      entidad: 'Usuario',
      entidadId: String(usuarioId),
      detalles: {
        permisosAsignados: permissionIds,
        cantidadPermisos: permissionIds.length,
      },
    })

    // ✅ NUEVO: Invalidar sesión del usuario para forzar recarga de permisos
    await invalidarSesionUsuario(usuarioId)

    revalidatePath('/dashboard/usuarios')
    revalidatePath(`/dashboard/usuarios/${usuarioId}/permisos`)

    return {
      success: true,
      message: 'Permisos actualizados correctamente. Los cambios se aplicarán en menos de 5 segundos.',
    }
  } catch (error) {
    console.error('Error al asignar permisos:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al asignar permisos',
    }
  }
}
