import { OpenAPIRoute } from "chanfana"
import type { AppContext } from "../types"
import { generateOAuthState, setOAuthStateCookie, setOAuthFrontendUrlCookie } from "../middleware/session"

/**
 * Google OAuth 2.0 Initialization Endpoint
 * 
 * Generates a secure state parameter and redirects user to Google authorization page
 * Uses Authorization Code Flow (backend-controlled)
 */
export class AuthGoogleInit extends OpenAPIRoute {
  schema = {
    tags: ["Authentication"],
    summary: "Google OAuth 2.0 initialization",
    description: "Initialize Google OAuth flow and redirect to Google authorization page",
    responses: {
      "302": {
        description: "Redirect to Google OAuth authorization page"
      },
      "500": {
        description: "OAuth not configured or initialization error"
      }
    }
  }

  /**
   * 從請求頭中獲取前端 URL（Origin 或 Referer）
   * 這樣可以支持多個前端端口（5173, 5174 等）
   * 
   * 優先順序：
   * 1. 從 Referer header 獲取（當從前端重定向到後端時，Referer 會包含前端 URL）
   * 2. 從 Origin header 獲取（CORS 請求時）
   * 3. 使用環境變數 FRONTEND_URL（生產環境應該設定）
   * 4. 預設值（開發環境）
   */
  private getFrontendUrl(c: AppContext): string {
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

    // ✅ 優先檢查 Referer（當從前端重定向到後端時，Referer 會包含前端 URL）
    const referer = c.req.header('Referer')
    const origin = c.req.header('Origin')
    
    // 優先使用 Referer（因為重定向時 Referer 更可靠）
    const sourceUrl = referer || origin
    let localhostUrlFromHeader: string | null = null
    
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
        } else {
          // ✅ 保存 localhost URL（如果來源是 localhost），供後續使用
          if (isLocalhost) {
            localhostUrlFromHeader = `${sourceUrlObj.protocol}//${sourceUrlObj.host}`
          }
          console.log('⚠️ Origin/Referer not allowed, checking FRONTEND_URL env')
          console.log('⚠️ Source hostname:', sourceHostname)
          console.log('⚠️ FRONTEND_URL env:', c.env.FRONTEND_URL)
        }
      } catch (e) {
        console.log('⚠️ Failed to parse Origin/Referer, checking FRONTEND_URL env')
        console.log('⚠️ Parse error:', e)
      }
    } else {
      console.log('⚠️ No Origin or Referer header, checking FRONTEND_URL env')
    }

    // ✅ 使用環境變數（生產環境必須設定）
    if (c.env.FRONTEND_URL) {
      const frontendUrl = c.env.FRONTEND_URL
      const isLocalhost = frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')
      
      // ✅ 關鍵修復：如果環境變數是 localhost，直接使用
      if (isLocalhost) {
        console.log('✅ Using FRONTEND_URL from environment (localhost detected):', frontendUrl)
        return frontendUrl
      }
      
      // ✅ 關鍵修復：如果環境變數是生產環境 URL，但請求來自 localhost，優先使用 localhost
      // 這防止本地開發時被生產環境 secrets 覆蓋
      if (localhostUrlFromHeader) {
        console.log('⚠️ FRONTEND_URL is production URL, but request is from localhost')
        console.log('✅ Using localhost URL from request header instead:', localhostUrlFromHeader)
        return localhostUrlFromHeader
      }
      
      // ✅ 如果沒有 localhost 來源，使用環境變數（生產環境）
      console.log('✅ Using FRONTEND_URL from environment (production):', frontendUrl)
      return frontendUrl
    }

    // ❌ FRONTEND_URL 必須設定，不提供 fallback
    console.error('❌ No frontend URL found: headers and FRONTEND_URL env all missing')
    throw new Error('FRONTEND_URL not configured. Please set FRONTEND_URL environment variable.')
  }

  async handle(c: AppContext) {
    try {
      console.log("Google OAuth initialization called")

      // Get Google OAuth configuration from environment
      const clientId = c.env.GOOGLE_CLIENT_ID
      const redirectUri = c.env.GOOGLE_REDIRECT_URI

      // ✅ 添加詳細日誌來追蹤實際使用的 redirect_uri
      console.log('🔍 Google OAuth Configuration Check:')
      console.log('  - GOOGLE_CLIENT_ID:', clientId ? `${clientId.substring(0, 20)}...` : 'MISSING')
      console.log('  - GOOGLE_REDIRECT_URI:', redirectUri || 'MISSING')
      console.log('  - Redirect URI length:', redirectUri?.length || 0)

      if (!clientId || !redirectUri) {
        console.error('GOOGLE_CLIENT_ID or GOOGLE_REDIRECT_URI not configured')
        
        // ✅ 重定向到前端並顯示錯誤訊息，而不是回傳 JSON
        // 這樣前端可以正確處理錯誤並顯示友好的錯誤訊息
        const frontendUrl = this.getFrontendUrl(c)
        return c.redirect(`${frontendUrl}/?error=oauth_not_configured&message=${encodeURIComponent('Google OAuth not configured. Please check backend configuration.')}`)
      }

      // ✅ 從請求頭中獲取前端 URL（Origin 或 Referer）
      // 這樣可以支持多個前端端口（5173, 5174 等）
      const frontendUrl = this.getFrontendUrl(c)

      // Generate secure state parameter (CSRF protection)
      const state = generateOAuthState()
      console.log("Generated OAuth state:", state.substring(0, 16) + "...")

      // Build Google OAuth URL
      const googleAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
      googleAuthUrl.searchParams.set('response_type', 'code')
      googleAuthUrl.searchParams.set('client_id', clientId)
      googleAuthUrl.searchParams.set('redirect_uri', redirectUri)
      googleAuthUrl.searchParams.set('scope', 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email')
      googleAuthUrl.searchParams.set('state', state)
      googleAuthUrl.searchParams.set('access_type', 'offline')
      googleAuthUrl.searchParams.set('prompt', 'consent')

      // ✅ 詳細日誌：顯示實際發送給 Google 的 redirect_uri
      console.log("🔍 Google OAuth URL Details:")
      console.log("  - Full OAuth URL:", googleAuthUrl.toString())
      console.log("  - Redirect URI sent to Google:", redirectUri)
      console.log("  - Expected redirect URI:", "https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback")
      console.log("  - Redirect URI matches expected:", redirectUri === "https://coach-backend.gamepig1976.workers.dev/api/auth/google/callback")
      console.log("Frontend URL to redirect back to:", frontendUrl)

      // Create redirect response
      let redirectResponse = c.redirect(googleAuthUrl.toString())

      // Set state in encrypted cookie
      redirectResponse = await setOAuthStateCookie(state, c.env, redirectResponse)
      
      // ✅ 將前端 URL 存儲在單獨的 cookie 中，以便在 callback 時使用
      redirectResponse = setOAuthFrontendUrlCookie(frontendUrl, redirectResponse)
      
      return redirectResponse

    } catch (error) {
      console.error("Error in Google OAuth initialization:", error)
      
      return c.json({
        success: false,
        message: "Internal server error"
      }, 500)
    }
  }
}

