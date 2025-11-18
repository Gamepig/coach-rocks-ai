/**
 * Email Authentication (Login & Register)
 * 
 * Handles email/password authentication with secure password hashing
 */

import type { AppContext } from '../types'
import { DatabaseService } from '../services/database'
import { hashPassword, verifyPassword } from './utils'
import { createSession } from './session'

/**
 * Register a new user with email and password
 */
export async function registerUser(
  email: string,
  password: string,
  env: any
): Promise<{ success: boolean; userId?: string; error?: string }> {
  try {
    const db = new DatabaseService(env)

    // Check if user already exists
    const existingUser = await db.getUserByEmail(email)
    if (existingUser) {
      return { success: false, error: 'User already exists' }
    }

    // Hash password
    const { hash, salt } = await hashPassword(password)

    // Create user
    const userId = crypto.randomUUID()
    const d1db = env.DB
    const createStmt = d1db.prepare(`
      INSERT INTO users (
        user_id,
        email,
        password_hash,
        auth_provider,
        verified,
        plan,
        onboarding_completed
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `)

    // Store password hash and salt together (format: hash:salt)
    const passwordHashWithSalt = `${hash}:${salt}`

    await createStmt.bind(
      userId,
      email,
      passwordHashWithSalt,
      'email',
      true, // ✅ For testing: mark as verified. In production, set to false and send verification email
      'free',
      false
    ).run()

    console.log('New user registered:', email)

    // TODO: Send verification email here
    // For now, mark as verified for testing
    // In production, send verification email and set verified = false

    return { success: true, userId }
  } catch (error) {
    console.error('Registration error:', error)
    return { success: false, error: 'Registration failed' }
  }
}

/**
 * Login with email and password
 */
export async function loginUser(
  email: string,
  password: string,
  env: any,
  request: Request
): Promise<{ 
  success: boolean
  sessionToken?: string
  user?: any
  error?: string
}> {
  try {
    const db = new DatabaseService(env)

    // Get user by email
    const user = await db.getUserByEmail(email)
    if (!user) {
      return { success: false, error: 'User not found' }
    }

    // Check if user is verified
    if (!user.verified) {
      return { success: false, error: 'Email not verified. Please verify your email first.' }
    }

    // Verify password
    const passwordHash = user.password_hash || ''
    if (!passwordHash || !passwordHash.includes(':')) {
      // Legacy user without password (email-only auth)
      // For backward compatibility, allow login without password
      console.log('Legacy user without password, allowing login')
    } else {
      // Extract hash and salt
      const [hash, salt] = passwordHash.split(':')
      if (!hash || !salt) {
        return { success: false, error: 'Invalid password format' }
      }

      const isValid = await verifyPassword(password, hash, salt)
      if (!isValid) {
        return { success: false, error: 'Invalid password' }
      }
    }

    // Create session token
    const sessionToken = await createSession(user.user_id, env, request)

    // Clean up expired sessions periodically
    try {
      await db.cleanupExpiredSessions()
    } catch (cleanupError) {
      console.warn('Failed to cleanup expired sessions:', cleanupError)
    }

    return {
      success: true,
      sessionToken,
      user: {
        user_id: user.user_id,
        email: user.email,
        plan: user.plan,
        verified: user.verified,
        onboarding_completed: user.onboarding_completed || false,
        last_login: user.last_login
      }
    }
  } catch (error) {
    console.error('Login error:', error)
    return { success: false, error: 'Login failed' }
  }
}

