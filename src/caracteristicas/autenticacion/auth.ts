import 'server-only'
import 'reflect-metadata'

import type { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import { verify } from '@node-rs/argon2'
import { UsuarioRepository } from '@/caracteristicas/usuarios/repositorio'
import { registrarAuditoria } from '@/compartido/lib/auditoria'
import { checkRateLimit, getRateLimitResetMinutes } from '@/compartido/lib/rate-limit'
import { CustomPrismaAdapter } from './adapter'

const usuarioRepo = new UsuarioRepository()

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 8 * 60 * 60, // 8 horas
    updateAge: 24 * 60 * 60, // Actualizar cada 24 horas
  },
  adapter: CustomPrismaAdapter(),
  pages: {
    signIn: '/iniciar-sesion',
  },
  // Configuración de cookies seguras (prevención Session Hijacking)
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? '__Secure-next-auth.session-token'
        : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  providers: [
    Credentials({
      name: 'Credentials',
      credentials: {
        correo: { label: 'Correo', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.correo || !credentials?.password) {
          await registrarAuditoria({
            accion: 'LOGIN_FAILED',
            detalles: { motivo: 'Credenciales vacías' },
            exitoso: false,
          })
          return null
        }

        const email = credentials.correo.toLowerCase().trim()

        // ✅ RATE LIMITING - Prevención de fuerza bruta
        const rateLimitResult = checkRateLimit(`login:${email}`, {
          windowMs: 15 * 60 * 1000, // 15 minutos
          max: 5, // 5 intentos
        })

        if (!rateLimitResult.success) {
          const minutesRemaining = getRateLimitResetMinutes(rateLimitResult.resetTime)
          await registrarAuditoria({
            accion: 'LOGIN_FAILED',
            detalles: {
              motivo: 'Rate limit excedido',
              email,
              minutosRestantes: minutesRemaining,
            },
            exitoso: false,
          })
          throw new Error(`Demasiados intentos. Intenta de nuevo en ${minutesRemaining} minutos.`)
        }

        // Buscar usuario
        const user = await usuarioRepo.findByEmail(email)

        if (!user) {
          await registrarAuditoria({
            accion: 'LOGIN_FAILED',
            detalles: { motivo: 'Usuario no encontrado', email },
            exitoso: false,
          })
          return null
        }

        // Verificar si está activo
        if (!user.activo) {
          await registrarAuditoria({
            usuarioId: user.id,
            accion: 'LOGIN_FAILED',
            detalles: { motivo: 'Usuario inactivo' },
            exitoso: false,
          })
          throw new Error('Usuario inactivo. Contacta al administrador.')
        }

        // Verificar si está bloqueado
        const isBlocked = await usuarioRepo.isBlocked(user.id)
        if (isBlocked) {
          await registrarAuditoria({
            usuarioId: user.id,
            accion: 'LOGIN_FAILED',
            detalles: { motivo: 'Usuario bloqueado por intentos fallidos' },
            exitoso: false,
          })
          throw new Error('Usuario temporalmente bloqueado. Intenta más tarde.')
        }

        // Verificar contraseña con Argon2
        const isValidPassword = await verify(user.contrasenaHash, credentials.password)

        if (!isValidPassword) {
          // Incrementar intentos fallidos
          await usuarioRepo.incrementFailedAttempts(user.id)
          await registrarAuditoria({
            usuarioId: user.id,
            accion: 'LOGIN_FAILED',
            detalles: { motivo: 'Contraseña incorrecta' },
            exitoso: false,
          })
          return null
        }

        // ✅ Login exitoso - Resetear intentos
        await usuarioRepo.resetFailedAttempts(user.id)
        await registrarAuditoria({
          usuarioId: user.id,
          accion: 'LOGIN',
          detalles: { email: user.correo },
          exitoso: true,
        })

        return {
          id: String(user.id),
          name: user.nombre,
          email: user.correo,
          rol: (user.rol?.nombre as 'administrador' | 'bodega' | 'sucursal' | 'produccion') ?? 'sucursal',
          sucursalId: user.sucursalGerente?.id ? String(user.sucursalGerente.id) : null,
        } as any
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = (user as any).id
        token.rol = (user as any).rol
        token.sucursalId = (user as any).sucursalId ?? null
        token.activo = true
      }

      // ✅ CRÍTICO: Recargar permisos en cada request o cuando se actualiza
      // Esto asegura que los cambios de permisos se reflejen sin necesidad de logout
      if (token.id && (trigger === 'update' || !token.permisos)) {
        try {
          const userId = parseInt(String(token.id))
          const userWithPermissions = await usuarioRepo.findById(userId)

          if (userWithPermissions) {
            // Combinar permisos del rol + permisos individuales
            const permisosRol = userWithPermissions.rol.permisos.map(rp => rp.permission.codigo)
            const permisosIndividuales = userWithPermissions.permisosIndividuales?.map(up => up.permission.codigo) || []

            // Unir ambos conjuntos de permisos (sin duplicados)
            const todosLosPermisos = [...new Set([...permisosRol, ...permisosIndividuales])]

            token.permisos = todosLosPermisos
            token.activo = userWithPermissions.activo
          }
        } catch (error) {
          console.error('Error al cargar permisos en token:', error)
          token.permisos = []
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.id)
        session.user.rol = token.rol as any
        session.user.sucursalId = (token as any).sucursalId ?? null
        session.user.permisos = (token.permisos as string[]) || []
        session.user.activo = (token as any).activo ?? true
      }
      return session
    },
  },
}
