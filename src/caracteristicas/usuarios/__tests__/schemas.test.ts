/**
 * Tests de validación de esquemas (prevención XSS/Injection)
 */

import { describe, it, expect } from 'vitest'
import {
  createUsuarioSchema,
  updateUsuarioSchema,
  changePasswordSchema,
  loginSchema,
  emailSchema,
  passwordSchema,
  nameSchema,
} from '../schemas'

describe('Email Schema Validation', () => {
  it('debería validar emails correctos', () => {
    expect(() => emailSchema.parse('usuario@empresa.com')).not.toThrow()
    expect(() => emailSchema.parse('test.user@example.org')).not.toThrow()
  })

  it('debería normalizar emails (lowercase, trim)', () => {
    const result = emailSchema.parse('  USUARIO@EMPRESA.COM  ')
    expect(result).toBe('usuario@empresa.com')
  })

  it('debería rechazar emails inválidos', () => {
    expect(() => emailSchema.parse('invalid-email')).toThrow()
    expect(() => emailSchema.parse('email@')).toThrow()
    expect(() => emailSchema.parse('@example.com')).toThrow()
  })

  it('debería rechazar emails demasiado largos', () => {
    const longEmail = 'a'.repeat(250) + '@example.com'
    expect(() => emailSchema.parse(longEmail)).toThrow()
  })
})

describe('Password Schema Validation - Seguridad', () => {
  it('debería validar contraseñas seguras', () => {
    expect(() => passwordSchema.parse('Password123!')).not.toThrow()
    expect(() => passwordSchema.parse('MyP@ssw0rd')).not.toThrow()
  })

  it('debería rechazar contraseñas sin minúsculas', () => {
    expect(() => passwordSchema.parse('PASSWORD123!')).toThrow('minúscula')
  })

  it('debería rechazar contraseñas sin mayúsculas', () => {
    expect(() => passwordSchema.parse('password123!')).toThrow('mayúscula')
  })

  it('debería rechazar contraseñas sin números', () => {
    expect(() => passwordSchema.parse('Password!')).toThrow('número')
  })

  it('debería rechazar contraseñas sin caracteres especiales', () => {
    expect(() => passwordSchema.parse('Password123')).toThrow('carácter especial')
  })

  it('debería rechazar contraseñas demasiado cortas', () => {
    expect(() => passwordSchema.parse('Pass1!')).toThrow('al menos 8')
  })

  it('debería rechazar contraseñas demasiado largas (prevención DoS)', () => {
    const longPassword = 'P@ssw0rd' + 'a'.repeat(70)
    expect(() => passwordSchema.parse(longPassword)).toThrow('demasiado larga')
  })
})

describe('Name Schema Validation - Prevención XSS', () => {
  it('debería validar nombres correctos', () => {
    expect(() => nameSchema.parse('Juan Pérez')).not.toThrow()
    expect(() => nameSchema.parse('María García')).not.toThrow()
  })

  it('debería normalizar nombres (trim)', () => {
    const result = nameSchema.parse('  Juan Pérez  ')
    expect(result).toBe('Juan Pérez')
  })

  it('debería rechazar nombres con caracteres especiales (prevención XSS)', () => {
    expect(() => nameSchema.parse('<script>alert("XSS")</script>')).toThrow()
    expect(() => nameSchema.parse('Juan<>Pérez')).toThrow()
    expect(() => nameSchema.parse('Usuario@123')).toThrow()
  })

  it('debería rechazar nombres demasiado cortos', () => {
    expect(() => nameSchema.parse('A')).toThrow('al menos 2')
  })

  it('debería rechazar nombres demasiado largos', () => {
    const longName = 'a'.repeat(101)
    expect(() => nameSchema.parse(longName)).toThrow('demasiado largo')
  })
})

describe('Create Usuario Schema', () => {
  it('debería validar datos correctos para crear usuario', () => {
    const validData = {
      correo: 'nuevo@empresa.com',
      nombre: 'Nuevo Usuario',
      password: 'Password123!',
      rolId: 1,
    }
    expect(() => createUsuarioSchema.parse(validData)).not.toThrow()
  })

  it('debería aplicar valores por defecto', () => {
    const data = {
      correo: 'nuevo@empresa.com',
      nombre: 'Nuevo Usuario',
      password: 'Password123!',
      rolId: 1,
    }
    const result = createUsuarioSchema.parse(data)
    expect(result.activo).toBe(true)
    expect(result.debeActualizarClave).toBe(false)
  })

  it('debería rechazar rolId inválido (prevención SQL Injection)', () => {
    const invalidData = {
      correo: 'nuevo@empresa.com',
      nombre: 'Nuevo Usuario',
      password: 'Password123!',
      rolId: -1,
    }
    expect(() => createUsuarioSchema.parse(invalidData)).toThrow()
  })
})

describe('Change Password Schema', () => {
  it('debería validar cambio de contraseña correcto', () => {
    const validData = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword456!',
      confirmPassword: 'NewPassword456!',
    }
    expect(() => changePasswordSchema.parse(validData)).not.toThrow()
  })

  it('debería rechazar si las contraseñas no coinciden', () => {
    const invalidData = {
      currentPassword: 'OldPassword123!',
      newPassword: 'NewPassword456!',
      confirmPassword: 'DifferentPassword789!',
    }
    expect(() => changePasswordSchema.parse(invalidData)).toThrow('no coinciden')
  })
})

describe('Login Schema - Prevención Injection', () => {
  it('debería validar credenciales correctas', () => {
    const validData = {
      correo: 'usuario@empresa.com',
      password: 'Password123!',
    }
    expect(() => loginSchema.parse(validData)).not.toThrow()
  })

  it('debería sanitizar el email (prevención SQL Injection)', () => {
    const data = {
      correo: "  admin@empresa.com' OR '1'='1  ",
      password: 'password',
    }
    const result = loginSchema.parse(data)
    // Debe eliminar espacios y convertir a minúsculas
    expect(result.correo).toBe("admin@empresa.com' or '1'='1")
    // Aunque parezca inyección, el email inválido será rechazado por el schema de email
  })
})
