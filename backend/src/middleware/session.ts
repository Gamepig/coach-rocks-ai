/**
 * Session Management for OAuth State Parameter
 * 
 * Handles secure storage and validation of OAuth state parameters
 * using encrypted cookies to prevent CSRF attacks
 */

import type { Env } from "../types"

/**
 * Generate a secure random state parameter (32 bytes = 256 bits)
 */
export function generateOAuthState(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  
  // Convert to hex string
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Create HMAC signature for state parameter
 * Uses JWT_SECRET to sign the state, preventing tampering
 */
async function signState(state: string, env: Env): Promise<string> {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(env.JWT_SECRET || 'default-secret')
  const stateData = encoder.encode(state)
  
  // Import key for HMAC
  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  // Sign the state
  const signature = await crypto.subtle.sign('HMAC', key, stateData)
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  // Return state:signature format
  return `${state}:${signatureHex}`
}

/**
 * Verify and extract state from signed value
 */
async function verifyState(signedState: string, env: Env): Promise<string | null> {
  try {
    const [state, signature] = signedState.split(':')
    if (!state || !signature) {
      return null
    }
    
    const encoder = new TextEncoder()
    const keyData = encoder.encode(env.JWT_SECRET || 'default-secret')
    const stateData = encoder.encode(state)
    
    // Import key for HMAC
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    
    // Convert signature from hex to ArrayBuffer
    const signatureBuffer = Uint8Array.from(
      signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    )
    
    // Verify signature
    const isValid = await crypto.subtle.verify('HMAC', key, signatureBuffer, stateData)
    
    return isValid ? state : null
  } catch (error) {
    console.error('Failed to verify state:', error)
    return null
  }
}

/**
 * Set OAuth state in signed cookie
 */
export async function setOAuthStateCookie(
  state: string,
  env: Env,
  response: Response
): Promise<Response> {
  const signedState = await signState(state, env)
  
  // Set cookie with secure flags
  // Note: In development (localhost), Secure flag may cause issues, but it's required for production
  // SameSite=None is required for OAuth redirects from third-party (Google) back to our backend
  const isProduction = env.FRONTEND_URL?.startsWith('https://') || false
  const secureFlag = isProduction ? 'Secure;' : ''
  const sameSiteFlag = isProduction ? 'SameSite=None' : 'SameSite=Lax'
  const cookieValue = `oauth_state=${signedState}; HttpOnly; ${secureFlag} ${sameSiteFlag}; Path=/; Max-Age=600` // 10 minutes
  
  const newHeaders = new Headers(response.headers)
  newHeaders.append('Set-Cookie', cookieValue)
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}

/**
 * Get and validate OAuth state from cookie
 */
export async function getOAuthStateFromCookie(
  request: Request,
  env: Env
): Promise<string | null> {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) {
    return null
  }
  
  const cookies = cookieHeader.split(';').map(c => c.trim())
  const stateCookie = cookies.find(c => c.startsWith('oauth_state='))
  
  if (!stateCookie) {
    return null
  }
  
  const signedState = stateCookie.split('=')[1]
  if (!signedState) {
    return null
  }
  
  return await verifyState(signedState, env)
}

/**
 * Clear OAuth state cookie
 */
export function clearOAuthStateCookie(response: Response): Response {
  const newHeaders = new Headers(response.headers)
  // Use SameSite=None for clearing cookies in production (must match cookie setting)
  newHeaders.append('Set-Cookie', 'oauth_state=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0')
  newHeaders.append('Set-Cookie', 'oauth_frontend_url=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0')
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}

/**
 * Set frontend URL in cookie (for OAuth redirect)
 */
export function setOAuthFrontendUrlCookie(frontendUrl: string, response: Response): Response {
  const isProduction = frontendUrl.startsWith('https://')
  const isLocalhost = frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')
  
  // ✅ 關鍵修復：本地開發環境使用 SameSite=Lax（不需要 Secure）
  // 生產環境使用 SameSite=None + Secure（跨域重定向需要）
  const secureFlag = isProduction ? 'Secure;' : ''
  const sameSiteFlag = isProduction ? 'SameSite=None' : 'SameSite=Lax'
  
  // ✅ 關鍵修復：本地開發時，確保 cookie 能正確傳遞
  // 使用更寬鬆的設定，確保在 OAuth callback 時 cookie 不會丟失
  const cookieValue = `oauth_frontend_url=${encodeURIComponent(frontendUrl)}; HttpOnly; ${secureFlag} ${sameSiteFlag}; Path=/; Max-Age=600` // 10 minutes
  
  console.log('🍪 Setting OAuth frontend URL cookie:', {
    frontendUrl,
    isProduction,
    isLocalhost,
    secureFlag: secureFlag || 'none',
    sameSiteFlag
  })
  
  const newHeaders = new Headers(response.headers)
  newHeaders.append('Set-Cookie', cookieValue)
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders
  })
}

/**
 * Get frontend URL from cookie
 */
export function getOAuthFrontendUrlFromCookie(request: Request): string | null {
  const cookieHeader = request.headers.get('Cookie')
  if (!cookieHeader) {
    return null
  }
  
  const cookies = cookieHeader.split(';').map(c => c.trim())
  const urlCookie = cookies.find(c => c.startsWith('oauth_frontend_url='))
  
  if (!urlCookie) {
    return null
  }
  
  const encodedUrl = urlCookie.split('=')[1]
  if (!encodedUrl) {
    return null
  }
  
  try {
    return decodeURIComponent(encodedUrl)
  } catch (e) {
    console.error('Failed to decode frontend URL from cookie:', e)
    return null
  }
}

