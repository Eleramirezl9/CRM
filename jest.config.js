const nextJest = require('next/jest')

const createJestConfig = nextJest({
  // Ruta al directorio de Next.js
  dir: './',
})

/** @type {import('jest').Config} */
const customJestConfig = {
  // Directorio de tests
  testMatch: [
    '<rootDir>/tests/unitarios/**/*.test.ts',
    '<rootDir>/tests/unitarios/**/*.test.tsx',
    '<rootDir>/tests/integracion/**/*.test.ts',
    '<rootDir>/tests/integracion/**/*.test.tsx',
  ],

  // Configuración de entorno (Node para server actions, jsdom para componentes)
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

  // Cobertura
  collectCoverageFrom: [
    'src/caracteristicas/**/*.ts',
    'src/compartido/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
  ],

  // Transformaciones
  moduleNameMapper: {
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/caracteristicas/(.*)$': '<rootDir>/src/caracteristicas/$1',
    '^@/compartido/(.*)$': '<rootDir>/src/compartido/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },

  // Umbrales de cobertura
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
}

module.exports = createJestConfig(customJestConfig)
