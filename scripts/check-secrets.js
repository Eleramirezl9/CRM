#!/usr/bin/env node
/**
 * Script para verificar que no haya credenciales expuestas en archivos del repositorio
 * Uso: node scripts/check-secrets.js
 *
 * Se puede agregar como pre-commit hook en .husky/pre-commit
 */

const fs = require('fs');
const path = require('path');

// Patrones de secretos a buscar
const SECRET_PATTERNS = [
  // Passwords de PostgreSQL (credenciales específicas comprometidas)
  { pattern: /aXDoaqSfJUsvTYMD/g, name: 'Database Password (SPECIFIC - COMPROMISED)' },

  // NextAuth Secrets (específicos)
  { pattern: /KkiISalZ3IEqJwScQXazBpBHoX7GPsXOlR/g, name: 'NextAuth Secret (SPECIFIC - COMPROMISED)' },

  // Upstash Redis (específico)
  { pattern: /AYwSAAIncDIwNjRmZmQwNDI5Y2U0ZTUyOTQ1OGVkZjhmOWMyMzhlOHAyMzU4NTg/g, name: 'Upstash Redis Token (SPECIFIC - COMPROMISED)' },

  // Supabase JWT tokens reales (no placeholders)
  { pattern: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.eyJpc3MiOiJzdXBhYmFzZSIuey[A-Za-z0-9_-]{50,}\.[A-Za-z0-9_-]+/g, name: 'Supabase JWT Token (REAL)' },

  // Connection strings con credenciales reales (no placeholders)
  // Evitar match con [YOUR-DB-PASSWORD], [PASSWORD], etc.
  { pattern: /postgresql:\/\/postgres[^:]*:[^[\]@]+@(?!.*\[)[a-z0-9.-]+\.(supabase\.co|pooler\.supabase\.com):\d+\/postgres/g, name: 'PostgreSQL Connection String (REAL)' },
];

// Archivos/directorios a ignorar
const IGNORE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  '.env',
  '.env.local',
  '.env.example', // Este debería tener solo placeholders
  'scripts/check-secrets.js', // Este archivo (contiene los patterns)
  'docs/INFORME-SEGURIDAD-URGENTE.md', // Informe de seguridad con credenciales antiguas documentadas
  'docs/RESUMEN-CORRECCIONES-SEGURIDAD.md', // Resumen con credenciales antiguas documentadas
];

// Extensiones de archivos a revisar
const FILE_EXTENSIONS = ['.js', '.ts', '.tsx', '.jsx', '.md', '.json', '.yml', '.yaml'];

let foundSecrets = [];

/**
 * Verifica si un path debe ser ignorado
 */
function shouldIgnore(filePath) {
  // Normalizar path para comparación
  const normalizedPath = filePath.replace(/\\/g, '/');
  return IGNORE_PATTERNS.some(pattern => {
    const normalizedPattern = pattern.replace(/\\/g, '/');
    return normalizedPath.includes(normalizedPattern) || normalizedPath.endsWith(normalizedPattern);
  });
}

/**
 * Verifica si un archivo tiene la extensión correcta
 */
function hasValidExtension(filePath) {
  return FILE_EXTENSIONS.some(ext => filePath.endsWith(ext));
}

/**
 * Busca secretos en un archivo
 */
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');

    SECRET_PATTERNS.forEach(({ pattern, name }) => {
      const matches = content.match(pattern);
      if (matches) {
        foundSecrets.push({
          file: filePath,
          secretType: name,
          matches: matches.length,
        });
      }
    });
  } catch (error) {
    console.error(`Error reading ${filePath}:`, error.message);
  }
}

/**
 * Escanea un directorio recursivamente
 */
function scanDirectory(dir) {
  try {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
      const filePath = path.join(dir, file);

      if (shouldIgnore(filePath)) {
        return;
      }

      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        scanDirectory(filePath);
      } else if (stat.isFile() && hasValidExtension(filePath)) {
        scanFile(filePath);
      }
    });
  } catch (error) {
    console.error(`Error scanning directory ${dir}:`, error.message);
  }
}

// Ejecutar escaneo
console.log('🔍 Escaneando repositorio en busca de secretos expuestos...\n');

const projectRoot = path.join(__dirname, '..');
scanDirectory(projectRoot);

// Reportar resultados
if (foundSecrets.length === 0) {
  console.log('✅ No se encontraron secretos expuestos.\n');
  process.exit(0);
} else {
  console.log('🚨 ¡ALERTA! Se encontraron secretos expuestos:\n');

  foundSecrets.forEach(({ file, secretType, matches }) => {
    console.log(`❌ ${file}`);
    console.log(`   Tipo: ${secretType}`);
    console.log(`   Coincidencias: ${matches}\n`);
  });

  console.log('⚠️  ACCIÓN REQUERIDA:');
  console.log('1. Elimina las credenciales de estos archivos');
  console.log('2. Reemplázalas con placeholders (ej: [YOUR-SECRET-HERE])');
  console.log('3. Rota las credenciales expuestas inmediatamente');
  console.log('4. Actualiza las credenciales en Vercel y .env local\n');

  process.exit(1);
}
