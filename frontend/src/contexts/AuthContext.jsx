/**
 * Authentication Context
 * 
 * Centralized authentication state management using React Context API
 * Provides a clean, simple interface for authentication operations
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { apiService, getBackendBaseUrl } from '../services/api'
import { isProduction } from '../config/environment'

// Authentication states
const AUTH_STATES = {
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  AUTHENTICATING: 'AUTHENTICATING',
  AUTHENTICATED: 'AUTHENTICATED',
  ERROR: 'ERROR'
}

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [authState, setAuthState] = useState(AUTH_STATES.UNAUTHENTICATED)
  const [user, setUser] = useState(null)
  const [error, setError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  /**
   * Initialize authentication state on mount
   * Checks for existing session token or OAuth callback
   */
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for OAuth callback or email verification in URL
        const urlParams = new URLSearchParams(window.location.search)
        const oauthToken = urlParams.get('token')
        const oauth = urlParams.get('oauth')
        const verified = urlParams.get('verified')

        if (oauth === 'success' && oauthToken) {
          // OAuth callback
          console.log('✅ OAuth callback detected in AuthContext')
          setAuthState(AUTH_STATES.AUTHENTICATING)
          
          // Save token
          apiService.setSessionToken(oauthToken)
          
          // Validate session
          const validation = await apiService.validateSession(true)
          if (validation.valid && validation.user) {
            setUser(validation.user)
            setAuthState(AUTH_STATES.AUTHENTICATED)
            setError(null)
            
            // ✅ 延遲清除 URL 參數，讓 App.jsx 的 OAuth callback 處理先完成
            // App.jsx 會處理 URL 參數清除，這裡不需要立即清除
            setTimeout(() => {
              const cleanUrl = window.location.pathname + (window.location.hash || '')
              const currentParams = new URLSearchParams(window.location.search)
              // 只有在 URL 參數仍然存在時才清除（App.jsx 可能已經清除了）
              if (currentParams.get('oauth') === 'success' && currentParams.get('token')) {
                window.history.replaceState({}, document.title, cleanUrl)
                console.log('✅ AuthContext: URL parameters cleared')
              }
            }, 3000)
          } else {
            setAuthState(AUTH_STATES.ERROR)
            setError('Session validation failed')
          }
        } else if (verified === 'true' && oauthToken) {
          // Email verification callback
          console.log('✅ Email verification callback detected')
          setAuthState(AUTH_STATES.AUTHENTICATING)
          
          // Save token
          apiService.setSessionToken(oauthToken)
          
          // Validate session
          const validation = await apiService.validateSession(true)
          if (validation.valid && validation.user) {
            setUser(validation.user)
            setAuthState(AUTH_STATES.AUTHENTICATED)
            setError(null)
            
            // Clear URL parameters
            const cleanUrl = window.location.pathname + (window.location.hash || '')
            window.history.replaceState({}, document.title, cleanUrl)
          } else {
            setAuthState(AUTH_STATES.ERROR)
            setError('Session validation failed')
          }
        } else {
          // Check for existing session token
          const token = apiService.getSessionToken()
          if (token) {
            console.log('✅ Found existing session token')
            setAuthState(AUTH_STATES.AUTHENTICATING)
            
            const validation = await apiService.validateSession(true)
            if (validation.valid && validation.user) {
              setUser(validation.user)
              setAuthState(AUTH_STATES.AUTHENTICATED)
              setError(null)
            } else {
              // Invalid token, clear it
              apiService.clearSessionToken()
              setAuthState(AUTH_STATES.UNAUTHENTICATED)
            }
          } else {
            setAuthState(AUTH_STATES.UNAUTHENTICATED)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setAuthState(AUTH_STATES.UNAUTHENTICATED)
        apiService.clearSessionToken()
      } finally {
        setIsInitialized(true)
      }
    }

    initializeAuth()
  }, [])

  /**
   * Login with email and password
   */
  const login = useCallback(async (email, password) => {
    try {
      setAuthState(AUTH_STATES.AUTHENTICATING)
      setError(null)

      const response = await apiService.login(email, password)
      
      if (response.success && response.sessionToken) {
        apiService.setSessionToken(response.sessionToken)
        
        // Validate session to get full user data
        const validation = await apiService.validateSession(true)
        if (validation.valid && validation.user) {
          setUser(validation.user)
          setAuthState(AUTH_STATES.AUTHENTICATED)
          return { success: true }
        }
      }

      throw new Error(response.message || 'Login failed')
    } catch (error) {
      console.error('Login error:', error)
      setAuthState(AUTH_STATES.ERROR)
      setError(error.message || 'Login failed')
      apiService.clearSessionToken()
      throw error
    }
  }, [])

  /**
   * Register with email and password
   */
  const register = useCallback(async (email, password) => {
    try {
      setAuthState(AUTH_STATES.AUTHENTICATING)
      setError(null)

      const response = await apiService.register(email, password)
      
      if (response.success) {
        // Registration successful, but user needs to verify email
        setAuthState(AUTH_STATES.UNAUTHENTICATED)
        return { success: true, message: 'Registration successful. Please verify your email.' }
      }

      throw new Error(response.message || 'Registration failed')
    } catch (error) {
      console.error('Registration error:', error)
      setAuthState(AUTH_STATES.ERROR)
      setError(error.message || 'Registration failed')
      throw error
    }
  }, [])

  /**
   * Login with Google OAuth
   * ✅ 修復：使用 getBackendBaseUrl() 確保環境變數驗證
   */
  const loginWithGoogle = useCallback(() => {
    try {
      const backendBaseUrl = getBackendBaseUrl()
      // getBackendBaseUrl() 已經包含完整驗證邏輯，包括異常字符清理和 URL 驗證
      // 如果驗證失敗，它會自動返回 DEFAULT_BACKEND_URL
      window.location.href = `${backendBaseUrl}/api/auth/google/init`
    } catch (error) {
      // 如果在開發環境拋出錯誤，顯示詳細訊息
      const isProd = isProduction()
      const errorMessage = isProd
        ? `❌ Google OAuth 無法使用：後端 URL 驗證失敗

詳細訊息：${error.message}

修復步驟：
1. 登入 Cloudflare Dashboard: https://dash.cloudflare.com
2. 前往：Pages → coach-rocks-frontend → Settings → Environment Variables
3. 檢查變數 VITE_BACKEND_BASE_URL 是否正確：
   - 應為：https://coach-backend.gamepig1976.workers.dev
   - 不應包含額外字符、特殊符號或換行
4. 重新部署前端應用`
        : `❌ Google OAuth 無法使用：後端 URL 驗證失敗

詳細訊息：${error.message}

修復步驟：
1. 檢查 frontend/.env 檔案中的 VITE_BACKEND_BASE_URL
2. 確保值為：https://coach-backend.gamepig1976.workers.dev
3. 不應包含額外字符、特殊符號或換行
4. 重新啟動開發伺服器`

      console.error('❌ Google OAuth loginWithGoogle error:', error)
      console.error('🔧 Environment variable:', import.meta.env.VITE_BACKEND_BASE_URL)
      alert(errorMessage)
    }
  }, [])

  /**
   * Logout
   */
  const logout = useCallback(async () => {
    try {
      await apiService.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      apiService.clearSessionToken()
      setUser(null)
      setAuthState(AUTH_STATES.UNAUTHENTICATED)
      setError(null)
    }
  }, [])

  /**
   * Clear error
   */
  const clearError = useCallback(() => {
    setError(null)
    if (authState === AUTH_STATES.ERROR) {
      setAuthState(AUTH_STATES.UNAUTHENTICATED)
    }
  }, [authState])

  const value = {
    authState,
    user,
    error,
    isInitialized,
    isAuthenticated: authState === AUTH_STATES.AUTHENTICATED,
    isAuthenticating: authState === AUTH_STATES.AUTHENTICATING,
    login,
    register,
    loginWithGoogle,
    logout,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Hook to use authentication context
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export { AUTH_STATES }

