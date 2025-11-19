import { OpenAPIRoute } from "chanfana"
import { z } from "zod"
import type { AppContext } from "../types"
import { DatabaseService } from "../services/database"
import { createUserSession } from "../middleware/auth"
import { getOAuthStateFromCookie, clearOAuthStateCookie, getOAuthFrontendUrlFromCookie } from "../middleware/session"

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
 * Google OAuth 2.0 Callback Endpoint
 * 
 * Handles OAuth 2.0 Authorization Code Flow:
 * 1. Validates state parameter (CSRF protection)
 * 2. Exchanges authorization code for access token
 * 3. Fetches user profile using access token
 * 4. Creates/updates user account
 * 5. Generates session token
 * 6. Redirects to frontend with token in URL parameters
 */
export class AuthGoogle extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "Google OAuth 2.0 callback",
    description: "Handle Google OAuth callback with authorization code",
    request: {
      query: {
        code: z.string().optional(),
        state: z.string().optional(),
        error: z.string().optional(),
        error_description: z.string().optional()
      }
    },
    responses: {
      "302": {
        description: "Redirect to frontend with session token"
      },
      "400": {
        description: "Invalid request (missing code or state)"
      },
      "401": {
        description: "Invalid state or OAuth error"
      },
      "500": {
        description: "Internal server error"
      }
    }
  }

  /**
   * Exchange authorization code for access token
   */
  private async exchangeGoogleAuthCode(
    code: string,
    env: any
  ): Promise<GoogleTokenResponse | null> {
    try {
      const redirectUri = env.GOOGLE_REDIRECT_URI
      
      // ✅ 添加詳細日誌來追蹤 token exchange 時使用的 redirect_uri
      console.log('🔍 Google Token Exchange Configuration:')
      console.log('  - Redirect URI used in token exchange:', redirectUri || 'MISSING')
      console.log('  - Expected redirect URI:', 'https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback')
      console.log('  - Redirect URI matches expected:', redirectUri === 'https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback')
      
      const tokenEndpoint = 'https://oauth2.googleapis.com/token'
      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri,
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
  private async getGoogleUserProfile(accessToken: string): Promise<GoogleUserProfile | null> {
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
  private async getOrCreateGoogleUser(
    db: DatabaseService,
    googleId: string,
    email: string,
    name: string,
    avatarUrl: string,
    env: any
  ): Promise<{ userId: string; isNewUser: boolean }> {
    try {
      // Access the D1 database instance directly from env
      const d1db = env.DB
      
      // First, try to find user by google_id
      const stmtByGoogleId = d1db.prepare(`
        SELECT * FROM users WHERE google_id = ?
      `)
      let user = await stmtByGoogleId.bind(googleId).first()

      if (user) {
        // Update last login and avatar if changed
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
      
      // For Google OAuth, password_hash is not needed (empty string)
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
   * 動態獲取前端 URL（避免硬編碼）
   * 優先順序：
   * 1. 從 cookie 中獲取（OAuth init 時設定）
   * 2. 從 Referer/Origin header 獲取
   * 3. 使用環境變數 FRONTEND_URL
   * 4. 如果都沒有，拋出錯誤（生產環境必須設定）
   */
  private getFrontendUrl(c: AppContext): string {
    // ✅ 優先從 cookie 中獲取（OAuth init 時設定）
    const cookieUrl = getOAuthFrontendUrlFromCookie(c.req.raw)
    if (cookieUrl) {
      console.log('✅ Using frontend URL from cookie:', cookieUrl)
      return cookieUrl
    }

    // ✅ 關鍵修復：檢查請求是否來自 localhost（本地開發環境）
    // 如果請求的 hostname 是 localhost，強制使用 localhost 前端 URL
    // 這適用於 wrangler dev 運行在 localhost:8788 的情況
    try {
      const requestUrl = new URL(c.req.url)
      const requestHostname = requestUrl.hostname
      const isRequestLocalhost = requestHostname === 'localhost' || requestHostname === '127.0.0.1'

      if (isRequestLocalhost) {
        const localhostFrontendUrl = c.env.DEV_FRONTEND_URL || 'http://localhost:5173'
        console.log('✅ Request is from localhost, forcing localhost frontend URL:', localhostFrontendUrl)
        console.log('  - Request hostname:', requestHostname)
        console.log('  - Request URL:', c.req.url)
        return localhostFrontendUrl
      }
    } catch (e) {
      console.log('⚠️ Failed to parse request URL:', e)
    }

    // ✅ 檢查環境變數是否為 localhost（本地開發環境）
    // 如果是 localhost，優先使用它，避免被生產環境 secrets 覆蓋
    if (c.env.FRONTEND_URL) {
      const frontendUrl = c.env.FRONTEND_URL
      const isLocalhost = frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')
      
      if (isLocalhost) {
        console.log('✅ Using FRONTEND_URL from environment (localhost detected):', frontendUrl)
        return frontendUrl
      }
      
      // ✅ 關鍵修復：如果是生產環境 URL，檢查是否有 Referer/Origin 來自 localhost
      // 這表示用戶在本地開發，應該使用 localhost 而不是生產環境 URL
      const referer = c.req.header('Referer')
      const origin = c.req.header('Origin')
      const sourceUrl = referer || origin
      
      if (sourceUrl) {
        try {
          const sourceUrlObj = new URL(sourceUrl)
          const sourceHostname = sourceUrlObj.hostname
          const isSourceLocalhost = sourceHostname === 'localhost' || sourceHostname === '127.0.0.1'
          
          if (isSourceLocalhost) {
            const localhostUrl = `${sourceUrlObj.protocol}//${sourceUrlObj.host}`
            console.log('⚠️ FRONTEND_URL is production URL, but request is from localhost')
            console.log('✅ Using localhost URL from request header instead:', localhostUrl)
            return localhostUrl
          }
        } catch (e) {
          console.log('⚠️ Failed to parse Origin/Referer:', e)
        }
      }
      
      // ✅ 如果沒有 localhost 來源，使用環境變數（生產環境）
      console.log('✅ Using FRONTEND_URL from environment (production):', frontendUrl)
      return frontendUrl
    }

    // ✅ 從請求頭中獲取前端 URL（Referer 或 Origin）- 僅作為最後的 fallback
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
          console.log('✅ Using frontend URL from request header (last fallback):', frontendUrl)
          return frontendUrl
        } else {
          console.log('⚠️ Origin/Referer not allowed')
        }
      } catch (e) {
        console.log('⚠️ Failed to parse Origin/Referer:', e)
      }
    }

    // ❌ 如果都沒有，拋出錯誤（生產環境不應該執行到這裡）
    console.error('❌ No frontend URL found: cookie, FRONTEND_URL env, and headers all missing')
    console.error('❌ Cookie header:', c.req.header('Cookie'))
    console.error('❌ Referer:', c.req.header('Referer'))
    console.error('❌ Origin:', c.req.header('Origin'))
    throw new Error('FRONTEND_URL not configured. Please set FRONTEND_URL secret in production.')
  }

  async handle(c: AppContext) {
    try {
      // Get query parameters
      const { code, state, error, error_description } = c.req.query()

      console.log("Google OAuth callback called", { 
        hasCode: !!code, 
        hasState: !!state, 
        error 
      })

      // ✅ 動態獲取前端 URL（避免硬編碼）
      let frontendUrl = this.getFrontendUrl(c)
      
      // Check for OAuth errors
      if (error) {
        console.error('Google OAuth error:', error, error_description)
        console.log('✅ Using frontend URL for error redirect:', frontendUrl)
        return c.redirect(`${frontendUrl}/?error=google_auth_error&details=${encodeURIComponent(error)}`)
      }

      // Validate required parameters
      if (!code || !state) {
        console.error('Missing code or state parameter')
        console.log('✅ Using frontend URL for error redirect:', frontendUrl)
        return c.redirect(`${frontendUrl}/?error=missing_auth_code`)
      }

      // Get Google OAuth configuration from environment
      const clientId = c.env.GOOGLE_CLIENT_ID
      const redirectUri = c.env.GOOGLE_REDIRECT_URI
      
      // ✅ 添加詳細日誌來追蹤實際使用的 redirect_uri
      console.log('🔍 Google OAuth Callback Configuration:')
      console.log('  - GOOGLE_CLIENT_ID:', clientId ? `${clientId.substring(0, 20)}...` : 'MISSING')
      console.log('  - GOOGLE_REDIRECT_URI:', redirectUri || 'MISSING')
      console.log('  - Redirect URI length:', redirectUri?.length || 0)
      console.log('✅ Using frontend URL for redirect:', frontendUrl)

      if (!clientId || !redirectUri) {
        console.error('GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI not configured')
        return c.redirect(`${frontendUrl}/?error=oauth_not_configured`)
      }

      // Validate state parameter (CSRF protection)
      const storedState = await getOAuthStateFromCookie(c.req.raw, c.env)
      if (!storedState || storedState !== state) {
        console.error('State parameter mismatch', { received: state, stored: storedState })
        return c.redirect(`${frontendUrl}/?error=invalid_state`)
      }

      console.log("State parameter validated successfully")

      // Exchange authorization code for access token
      const tokenResponse = await this.exchangeGoogleAuthCode(code, c.env)
      
      if (!tokenResponse || !tokenResponse.access_token) {
        console.error('Failed to exchange authorization code')
        return c.redirect(`${frontendUrl}/?error=token_exchange_failed`)
      }

      console.log("Access token obtained successfully")

      // Get user profile using access token
      const userProfile = await this.getGoogleUserProfile(tokenResponse.access_token)
      
      if (!userProfile || !userProfile.email || !userProfile.verified_email) {
        console.error('Failed to get user profile or email not verified')
        return c.redirect(`${frontendUrl}/?error=profile_fetch_failed`)
      }

      console.log("User profile fetched:", userProfile.email)

      const db = new DatabaseService(c.env)

      // Get or create user
      const { userId, isNewUser } = await this.getOrCreateGoogleUser(
        db,
        userProfile.id, // Google user ID
        userProfile.email,
        userProfile.name,
        userProfile.picture || '',
        c.env
      )

      // Create session token
      const sessionToken = await createUserSession(userId, c.env, c.req.raw)

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

      console.log("Redirecting to frontend with session token")

      // Create redirect response and clear state cookie
      const redirectResponse = c.redirect(redirectUrl.toString())
      return clearOAuthStateCookie(redirectResponse)

    } catch (error) {
      console.error("❌ Error in Google OAuth callback:", error)
      console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace')
      console.error("❌ Error message:", error instanceof Error ? error.message : String(error))
      
      // ✅ 嘗試獲取前端 URL（如果失敗，使用環境變數或拋出錯誤）
      try {
        const frontendUrl = this.getFrontendUrl(c)
        console.log('✅ Using frontend URL for error redirect:', frontendUrl)
        return c.redirect(`${frontendUrl}/?error=oauth_processing_error`)
      } catch (urlError) {
        // 如果連前端 URL 都無法獲取，回傳 JSON 錯誤
        console.error('❌ Failed to get frontend URL for error redirect:', urlError)
        return c.json({
          success: false,
          message: "OAuth processing error and frontend URL not configured"
        }, 500)
      }
    }
  }
}
