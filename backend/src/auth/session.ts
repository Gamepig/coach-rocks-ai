/**
 * Session Management
 * 
 * Handles session token creation, validation, and storage
 */

import type { Env } from '../types'
import { DatabaseService } from '../services/database'
import { generateSessionToken, hashToken } from './utils'

export interface SessionData {
  userId: string
  email: string
  expiresAt: Date
}

/**
 * Create a new session for a user
 */
export async function createSession(
  userId: string,
  env: Env,
  request: Request,
  durationDays: number = 30
): Promise<string> {
  const db = new DatabaseService(env)

  // Generate session token
  const sessionToken = generateSessionToken()
  const tokenHash = await hashToken(sessionToken)

  // Set expiration
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + durationDays)

  // Extract metadata from request
  const userAgent = request.headers.get('User-Agent') || undefined
  const ipAddress = request.headers.get('CF-Connecting-IP') ||
                   request.headers.get('X-Forwarded-For') ||
                   undefined

  // Store in database
  await db.createSessionToken(userId, tokenHash, expiresAt, userAgent, ipAddress)

  return sessionToken
}

/**
 * Validate a session token and return user data
 */
export async function validateSession(
  token: string,
  env: Env
): Promise<{ valid: boolean; user?: any; error?: string }> {
  try {
    const db = new DatabaseService(env)
    const tokenHash = await hashToken(token)
    const user = await db.getUserBySessionToken(tokenHash)

    if (!user) {
      return { valid: false, error: 'Invalid or expired session token' }
    }

    return { valid: true, user }
  } catch (error) {
    console.error('Session validation error:', error)
    return { valid: false, error: 'Session validation failed' }
  }
}

/**
 * Delete a session (logout)
 */
export async function deleteSession(
  token: string,
  env: Env
): Promise<boolean> {
  try {
    const db = new DatabaseService(env)
    const tokenHash = await hashToken(token)
    
    // Mark session as inactive instead of deleting (for audit purposes)
    const d1db = (env as any).DB
    const stmt = d1db.prepare(`
      UPDATE session_tokens 
      SET is_active = FALSE 
      WHERE token_hash = ?
    `)
    await stmt.bind(tokenHash).run()
    
    return true
  } catch (error) {
    console.error('Session deletion error:', error)
    return false
  }
}

