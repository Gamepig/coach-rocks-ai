/**
 * Complete Onboarding Endpoint
 * Marks onboarding as completed for the authenticated user
 */

import { OpenAPIRoute } from 'chanfana'
import { Context } from 'hono'
import { Env } from '../types'
import { z } from 'zod'

// Import auth middleware
const jwt = require('@tsndr/cloudflare-worker-jwt')

const CompleteOnboardingRequest = z.object({})

const CompleteOnboardingResponse = z.object({
  success: z.boolean(),
  message: z.string(),
  user: z.object({
    user_id: z.string(),
    email: z.string(),
    onboarding_completed: z.boolean()
  }).optional()
})

export class CompleteOnboarding extends OpenAPIRoute {
  schema = {
    tags: ['Onboarding'],
    summary: 'Mark onboarding as completed',
    description: 'Updates the authenticated user\'s onboarding status to completed',
    security: [{ bearerAuth: [] }],
    request: {
      body: {
        content: {
          'application/json': {
            schema: CompleteOnboardingRequest
          }
        }
      }
    },
    responses: {
      '200': {
        description: 'Onboarding completed successfully',
        content: {
          'application/json': {
            schema: CompleteOnboardingResponse
          }
        }
      },
      '400': {
        description: 'Invalid request'
      },
      '401': {
        description: 'Unauthorized - missing or invalid token'
      },
      '500': {
        description: 'Internal server error'
      }
    }
  }

  async handle(c: Context<{ Bindings: Env }>) {
    try {
      // Get authorization header and validate session
      const authHeader = c.req.header('Authorization')
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return c.json({
          success: false,
          message: 'Missing or invalid authorization header'
        }, 401)
      }

      const token = authHeader.substring(7)

      // Hash the token for lookup
      const encoder = new TextEncoder()
      const tokenData = encoder.encode(token)
      const hashBuffer = await crypto.subtle.digest('SHA-256', tokenData)
      const hashArray = new Uint8Array(hashBuffer)
      const tokenHash = Array.from(hashArray)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('')

      // Validate session and get user info
      const sessionQuery = await c.env.DB.prepare(
        'SELECT u.user_id, u.email FROM users u JOIN session_tokens st ON u.user_id = st.user_id WHERE st.token_hash = ? AND st.is_active = TRUE AND st.expires_at > datetime(\'now\')'
      ).bind(tokenHash).first()

      if (!sessionQuery) {
        return c.json({
          success: false,
          message: 'Invalid or expired session'
        }, 401)
      }

      const userId = sessionQuery.user_id

      console.log('📝 Completing onboarding for user:', userId)

      // Update onboarding_completed status
      const updateResult = await c.env.DB.prepare(
        'UPDATE users SET onboarding_completed = TRUE WHERE user_id = ?'
      ).bind(userId).run()

      if (!updateResult.success) {
        throw new Error('Failed to update onboarding status')
      }

      console.log('✅ Onboarding completed for user:', userId)

      // Fetch updated user info
      const user = await c.env.DB.prepare(
        'SELECT user_id, email, onboarding_completed FROM users WHERE user_id = ?'
      ).bind(userId).first()

      return c.json({
        success: true,
        message: 'Onboarding completed successfully',
        user: {
          user_id: user.user_id,
          email: user.email,
          onboarding_completed: user.onboarding_completed
        }
      })

    } catch (error) {
      console.error('❌ Error in completeOnboarding:', error)

      return c.json({
        success: false,
        message: 'Failed to complete onboarding'
      }, 500)
    }
  }
}
