/**
 * Server-only auth utilities
 * This file acts as a barrier to prevent client-side imports
 */
import 'server-only'

import { getServerSession as nextAuthGetServerSession } from 'next-auth'
import { authOptions } from './auth'

/**
 * Get server session - wrapper to prevent authOptions from being bundled
 */
export async function getServerSession() {
  return nextAuthGetServerSession(authOptions)
}

/**
 * Re-export authOptions for API routes that need it
 */
export { authOptions }
