/**
 * Esquemas de validación para usuarios
 * Previene XSS, SQL Injection mediante validación estricta
 */

import { z } from 'zod'

// Validación de email con sanitización
export const emailSchema = z
  .string()
  .email('Email inválido')
  .toLowerCase()
  .trim()
  .max(255, 'Email demasiado largo')

// Validación de contraseña segura
export const passwordSchema = z
  .string()
  .min(8, 'La contraseña debe tener al menos 8 caracteres')
  .max(72, 'La contraseña es demasiado larga') // bcrypt max
  .regex(/[a-z]/, 'Debe contener al menos una minúscula')
  .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
  .regex(/[0-9]/, 'Debe contener al menos un número')
  .regex(/[^a-zA-Z0-9]/, 'Debe contener al menos un carácter especial')

// Validación de nombre con sanitización XSS
export const nameSchema = z
  .string()
  .trim()
  .min(2, 'El nombre debe tener al menos 2 caracteres')
  .max(100, 'El nombre es demasiado largo')
  .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, 'El nombre solo puede contener letras y espacios')

// Schema para crear usuario
export const createUsuarioSchema = z.object({
  correo: emailSchema,
  nombre: nameSchema,
  password: passwordSchema,
  rolId: z.number().int().positive('Rol inválido'),
  sucursalId: z.string().optional().nullable(),
  activo: z.boolean().default(true),
  debeActualizarClave: z.boolean().default(false),
})

// Schema para actualizar usuario (sin contraseña obligatoria)
export const updateUsuarioSchema = z.object({
  correo: emailSchema.optional(),
  nombre: nameSchema.optional(),
  rolId: z.number().int().positive('Rol inválido').optional(),
  sucursalId: z.string().optional().nullable(),
  activo: z.boolean().optional(),
  debeActualizarClave: z.boolean().optional(),
})

// Schema para cambiar contraseña
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Contraseña actual requerida'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
})

// Schema para login
export const loginSchema = z.object({
  correo: emailSchema,
  password: z.string().min(1, 'Contraseña requerida'),
})

// Tipos inferidos
export type CreateUsuarioInput = z.infer<typeof createUsuarioSchema>
export type UpdateUsuarioInput = z.infer<typeof updateUsuarioSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
export type LoginInput = z.infer<typeof loginSchema>
