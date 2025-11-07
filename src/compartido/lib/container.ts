/**
 * Contenedor de Inyección de Dependencias
 * Configuración de tsyringe para DI
 */

import 'reflect-metadata'
import { container } from 'tsyringe'

// Importar y registrar repositorios cuando los creemos
// import { UsuarioRepository } from '@/caracteristicas/usuarios/repositorio'
// import { RoleRepository } from '@/caracteristicas/roles/repositorio'

// Registrar servicios singleton
// container.registerSingleton('UsuarioRepository', UsuarioRepository)
// container.registerSingleton('RoleRepository', RoleRepository)

export { container }
