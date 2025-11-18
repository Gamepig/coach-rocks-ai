/**
 * Google OAuth 2.0 Authentication
 * 
 * Simplified and correct implementation of Google OAuth flow
 */

import type { AppContext } from '../types'
import { DatabaseService } from '../services/database'
import { createSession } from './session'
import { getOAuthStateFromCookie, clearOAuthStateCookie, getOAuthFrontendUrlFromCookie } from '../middleware/session'

type GoogleUserProfile = {
  id: string
  email: string
  verified_email: boolean
  name: string
  given_name?: string
  family_name?: string
  picture?: string
}

type GoogleTokenResponse = {
  access_token: string
  expires_in: number
  refresh_token?: string
  scope: string
  token_type: string
  error?: string
  error_description?: string
}

/**
 * Exchange authorization code for access token
 */
async function exchangeGoogleAuthCode(
  code: string,
  env: any
): Promise<GoogleTokenResponse | null> {
  try {
    const tokenEndpoint = 'https://oauth2.googleapis.com/token'
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET
    })

    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Google token exchange failed:', response.status, errorData)
      return null
    }

    const tokenData = await response.json() as GoogleTokenResponse

    if (tokenData.error) {
      console.error('Google token exchange error:', tokenData.error, tokenData.error_description)
      return null
    }

    return tokenData
  } catch (error) {
    console.error('Error exchanging Google auth code:', error)
    return null
  }
}

/**
 * Get user profile using access token
 */
async function getGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile | null> {
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('Google user profile fetch failed:', response.status, errorData)
      return null
    }

    const profile = await response.json() as GoogleUserProfile
    return profile
  } catch (error) {
    console.error('Error fetching Google user profile:', error)
    return null
  }
}

/**
 * Get or create user by Google ID
 */
async function getOrCreateGoogleUser(
  db: DatabaseService,
  googleId: string,
  email: string,
  name: string,
  avatarUrl: string,
  env: any
): Promise<{ userId: string; isNewUser: boolean }> {
  try {
    const d1db = env.DB

    // First, try to find user by google_id
    const stmtByGoogleId = d1db.prepare(`
      SELECT * FROM users WHERE google_id = ?
    `)
    let user = await stmtByGoogleId.bind(googleId).first()

    if (user) {
      // Update last login and avatar
      const updateStmt = d1db.prepare(`
        UPDATE users 
        SET last_login = CURRENT_TIMESTAMP,
            avatar_url = ?,
            verified = TRUE
        WHERE user_id = ?
      `)
      await updateStmt.bind(avatarUrl || null, user.user_id).run()

      return { userId: user.user_id, isNewUser: false }
    }

    // If not found by google_id, check by email (might be existing user linking Google)
    const userByEmail = await db.getUserByEmail(email)

    if (userByEmail) {
      // Link Google account to existing user
      const linkStmt = d1db.prepare(`
        UPDATE users 
        SET google_id = ?,
            auth_provider = 'google',
            avatar_url = ?,
            verified = TRUE,
            last_login = CURRENT_TIMESTAMP
        WHERE user_id = ?
      `)
      await linkStmt.bind(googleId, avatarUrl || null, userByEmail.user_id).run()

      return { userId: userByEmail.user_id, isNewUser: false }
    }

    // Create new user
    const userId = crypto.randomUUID()
    const createStmt = d1db.prepare(`
      INSERT INTO users (
        user_id, 
        email, 
        password_hash, 
        google_id,
        auth_provider,
        avatar_url,
        verified,
        plan,
        onboarding_completed,
        last_login
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `)

    await createStmt.bind(
      userId,
      email,
      '', // No password for OAuth users
      googleId,
      'google',
      avatarUrl || null,
      true, // Verified by Google
      'free', // Default plan
      false // New users need onboarding
    ).run()

    console.log('New Google user created:', email, 'Google ID:', googleId)
    return { userId, isNewUser: true }
  } catch (error) {
    console.error('Error getting or creating Google user:', error)
    throw error
  }
}

/**
 * Handle Google OAuth callback
 */
/**
 * 動態獲取前端 URL（避免硬編碼）
 */
function getFrontendUrlFromRequest(c: AppContext): string {
  // ✅ 優先從 cookie 中獲取（OAuth init 時設定）
  const cookieUrl = getOAuthFrontendUrlFromCookie(c.req.raw)
  if (cookieUrl) {
    console.log('✅ Using frontend URL from cookie:', cookieUrl)
    return cookieUrl
  }

  // ✅ 從請求頭中獲取前端 URL（Referer 或 Origin）
  const referer = c.req.header('Referer')
  const origin = c.req.header('Origin')
  const sourceUrl = referer || origin
  
  if (sourceUrl) {
    try {
      const sourceUrlObj = new URL(sourceUrl)
      const sourceHostname = sourceUrlObj.hostname
      
      // ✅ 允許 localhost、127.0.0.1，或與 FRONTEND_URL 匹配的域名
      const isLocalhost = sourceHostname === 'localhost' || sourceHostname === '127.0.0.1'
      const matchesFrontendUrl = c.env.FRONTEND_URL && (
        c.env.FRONTEND_URL.includes(sourceHostname) || 
        sourceHostname.includes(new URL(c.env.FRONTEND_URL).hostname)
      )
      
      if (isLocalhost || matchesFrontendUrl) {
        const frontendUrl = `${sourceUrlObj.protocol}//${sourceUrlObj.host}`
        console.log('✅ Using frontend URL from request header:', frontendUrl)
        return frontendUrl
      }
    } catch (e) {
      console.log('⚠️ Failed to parse Origin/Referer')
    }
  }

  // ✅ 使用環境變數（生產環境必須設定）
  if (c.env.FRONTEND_URL) {
    console.log('✅ Using FRONTEND_URL from environment:', c.env.FRONTEND_URL)
    return c.env.FRONTEND_URL
  }

  // ❌ 如果都沒有，拋出錯誤（生產環境不應該執行到這裡）
  console.error('❌ No frontend URL found: cookie, headers, and FRONTEND_URL env all missing')
  throw new Error('FRONTEND_URL not configured. Please set FRONTEND_URL secret in production.')
}

export async function handleGoogleCallback(c: AppContext) {
  try {
    const { code, state, error, error_description } = c.req.query()

    // ✅ 動態獲取前端 URL（避免硬編碼）
    let frontendUrl = getFrontendUrlFromRequest(c)

    // Check for OAuth errors
    if (error) {
      console.error('Google OAuth error:', error, error_description)
      return c.redirect(`${frontendUrl}/?error=google_auth_error&details=${encodeURIComponent(error)}`)
    }

    // Validate required parameters
    if (!code || !state) {
      console.error('Missing code or state parameter')
      return c.redirect(`${frontendUrl}/?error=missing_auth_code`)
    }

    // Validate state parameter (CSRF protection)
    const storedState = await getOAuthStateFromCookie(c.req.raw, c.env)
    if (!storedState || storedState !== state) {
      console.error('State parameter mismatch', { received: state, stored: storedState })
      return c.redirect(`${frontendUrl}/?error=invalid_state`)
    }

    // Exchange authorization code for access token
    const tokenResponse = await exchangeGoogleAuthCode(code, c.env)

    if (!tokenResponse || !tokenResponse.access_token) {
      console.error('Failed to exchange authorization code')
      return c.redirect(`${frontendUrl}/?error=token_exchange_failed`)
    }

    // Get user profile using access token
    const userProfile = await getGoogleUserProfile(tokenResponse.access_token)

    if (!userProfile || !userProfile.email || !userProfile.verified_email) {
      console.error('Failed to get user profile or email not verified')
      return c.redirect(`${frontendUrl}/?error=profile_fetch_failed`)
    }

    const db = new DatabaseService(c.env)

    // Get or create user
    const { userId } = await getOrCreateGoogleUser(
      db,
      userProfile.id,
      userProfile.email,
      userProfile.name,
      userProfile.picture || '',
      c.env
    )

    // Create session token
    const sessionToken = await createSession(userId, c.env, c.req.raw)

    // Get user data for response
    const user = await db.getUserByEmail(userProfile.email)

    // Clean up expired sessions periodically
    try {
      await db.cleanupExpiredSessions()
    } catch (cleanupError) {
      console.warn('Failed to cleanup expired sessions:', cleanupError)
    }

    // Build redirect URL with token and user data
    const redirectUrl = new URL(frontendUrl)
    redirectUrl.searchParams.set('token', sessionToken)
    redirectUrl.searchParams.set('oauth', 'success')
    redirectUrl.searchParams.set('provider', 'google')

    // Add user data to URL parameters
    if (userProfile.name) {
      redirectUrl.searchParams.set('userName', userProfile.name)
    }
    if (userProfile.email) {
      redirectUrl.searchParams.set('userEmail', userProfile.email)
    }
    if (userProfile.picture) {
      redirectUrl.searchParams.set('userAvatar', userProfile.picture)
    }

    console.log('Redirecting to frontend with session token')

    // Create redirect response and clear state cookie
    const redirectResponse = c.redirect(redirectUrl.toString())
    return clearOAuthStateCookie(redirectResponse)

  } catch (error) {
    console.error('Error in Google OAuth callback:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Error message:', error instanceof Error ? error.message : String(error))

    // ✅ 嘗試獲取前端 URL（如果失敗，回傳 JSON 錯誤）
    try {
      const frontendUrl = getFrontendUrlFromRequest(c)
      return c.redirect(`${frontendUrl}/?error=oauth_processing_error`)
    } catch (urlError) {
      console.error('❌ Failed to get frontend URL for error redirect:', urlError)
      return c.json({
        success: false,
        message: "OAuth processing error and frontend URL not configured"
      }, 500)
    }
  }
}

