import type { Adapter, AdapterSession, AdapterUser, VerificationToken } from 'next-auth/adapters'
import { prisma } from '@/lib/prisma'

// Custom Adapter implementing only what we need for Credentials + JWT
export function CustomPrismaAdapter(): Adapter {
  return {
    // Users
    async createUser(user) {
      const created = await prisma.usuario.create({
        data: {
          nombre: user.name ?? '',
          correo: user.email!,
          // Require caller to set password hash separately when creating seed users.
          contrasenaHash: '',
          rol: { connect: { id: 1 } }, // Assume role id 1 exists (administrador) for initial creation
        },
      })
      return mapToAdapterUser(created)
    },
    async getUser(id) {
      const u = await prisma.usuario.findUnique({ where: { id: Number(id) }, include: { sucursalGerente: true, rol: true } })
      return u ? mapToAdapterUser(u) : null
    },
    async getUserByEmail(email) {
      const u = await prisma.usuario.findUnique({ where: { correo: email }, include: { sucursalGerente: true, rol: true } })
      return u ? mapToAdapterUser(u) : null
    },
    async updateUser(user) {
      const u = await prisma.usuario.update({
        where: { id: Number(user.id) },
        data: { nombre: user.name ?? undefined, correo: user.email ?? undefined },
        include: { sucursalGerente: true, rol: true },
      })
      return mapToAdapterUser(u)
    },
    async deleteUser(userId) {
      await prisma.usuario.delete({ where: { id: Number(userId) } })
      return null
    },

    // Accounts (not used for Credentials)
    async linkAccount() { return undefined as any },
    async unlinkAccount() { return undefined as any },
    async getUserByAccount() { return null },

    // Sessions (not used with JWT strategy)
    async createSession() { return undefined as unknown as AdapterSession },
    async getSessionAndUser() { return null },
    async updateSession() { return undefined as unknown as AdapterSession },
    async deleteSession() { return undefined },

    // Verification tokens (not used)
    async createVerificationToken(token) { return token as VerificationToken },
    async useVerificationToken() { return null },
  }
}

function mapToAdapterUser(u: any): AdapterUser {
  return {
    id: String(u.id),
    name: u.nombre,
    email: u.correo,
    emailVerified: null,
  }
}
