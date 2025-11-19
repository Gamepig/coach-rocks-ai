import React, { useState, useEffect, useRef } from 'react'
import { getBackendBaseUrl } from '../../services/api'
import { isProduction } from '../../config/environment'
import './LoginPrompt.css'

const LoginPrompt = ({ onLogin, onCancel, onRegister }) => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isRegistering, setIsRegistering] = useState(false)
  const [password, setPassword] = useState('')
  
  // ✅ 修復：添加超時保護機制，防止 isLoading 狀態被卡住
  const loadingTimeoutRef = useRef(null)
  const mountedRef = useRef(true)
  
  // ✅ 修復：組件掛載時檢查並重置可能被卡住的狀態
  useEffect(() => {
    mountedRef.current = true
    
    // 如果組件掛載時 isLoading 為 true，立即重置（可能是之前的狀態殘留）
    if (isLoading) {
      console.warn('⚠️ LoginPrompt mounted with isLoading=true, resetting...')
      setIsLoading(false)
    }
    
    return () => {
      mountedRef.current = false
    }
  }, []) // 只在掛載時執行一次
  
  useEffect(() => {
    // 如果 isLoading 為 true 超過 10 秒，自動重置（縮短超時時間）
    if (isLoading) {
      loadingTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) {
          console.warn('⚠️ Login loading state timeout (10s), resetting...')
          setIsLoading(false)
          setError('登入超時，請重試。如果問題持續，請檢查網路連線或後端 URL 配置。')
        }
      }, 10000) // 10 秒超時（縮短）
    } else {
      // 清除超時計時器
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
        loadingTimeoutRef.current = null
      }
    }
    
    // 清理函數
    return () => {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current)
      }
    }
  }, [isLoading])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email || (isRegistering && !password)) return
    
    // ✅ 修復：如果已經在載入中，防止重複提交
    if (isLoading) {
      console.warn('⚠️ Login already in progress, ignoring duplicate submit')
      return
    }

    setIsLoading(true)
    setError('') // ✅ 清除之前的錯誤訊息
    
    // ✅ 修復：清除之前的超時計時器
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current)
      loadingTimeoutRef.current = null
    }

    try {
      if (isRegistering) {
        await onRegister(email, password) // Assuming onRegister prop is passed
      } else {
        await onLogin(email, password) // Modify onLogin to accept password
      }
      // ✅ 如果登入成功，onLogin 不會返回，會直接關閉 modal
      // 所以這裡不需要額外處理
      // ✅ 但為了安全起見，確保 isLoading 被重置（如果 modal 沒有關閉）
      setIsLoading(false)
    } catch (error) {
      // ✅ 確保錯誤訊息正確顯示
      const errorMessage = error?.message || error?.toString() || (isRegistering ? 'Registration failed. Please try again.' : 'Login failed. Please check your email and try again.')
      console.error('❌ Login/Register error:', error)
      setError(errorMessage)
      // ✅ 確保錯誤訊息可見（滾動到錯誤訊息位置）
      setTimeout(() => {
        const errorElement = document.querySelector('.error-message')
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }, 100)
    } finally {
      // ✅ 修復：使用 finally 確保 isLoading 一定會被重置
      // 使用 setTimeout 確保在所有狀態更新完成後重置
      setTimeout(() => {
        setIsLoading(false)
      }, 50)
    }
  }

  const handleGoogleLogin = () => {
    try {
      // ✅ 修復：使用 getBackendBaseUrl() 確保環境變數驗證
      const backendBaseUrl = getBackendBaseUrl()
      // getBackendBaseUrl() 已包含完整驗證邏輯
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

      console.error('❌ Google OAuth handleGoogleLogin error:', error)
      console.error('🔧 Environment variable:', import.meta.env.VITE_BACKEND_BASE_URL)

      // ✅ 使用 UI 狀態顯示錯誤
      setError(errorMessage)
      // ✅ 確保錯誤訊息可見（滾動到錯誤訊息位置）
      setTimeout(() => {
        const errorElement = document.querySelector('.error-message')
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }, 100)
      return
    }
    // Redirect to backend OAuth initialization endpoint
    // Backend will handle state generation and redirect to Google
    window.location.href = `${backendBaseUrl}/api/auth/google/init`
  }

  return (
    <div 
      className="login-prompt-overlay"
      onClick={(e) => {
        // ✅ 修復：點擊 overlay（背景）時，如果 isLoading 為 true，重置狀態
        if (e.target === e.currentTarget && isLoading) {
          console.warn('⚠️ Overlay clicked while loading, resetting login state...')
          setIsLoading(false)
          setError('登入已取消。請重試。')
        }
      }}
    >
      <div className="login-prompt" onClick={(e) => e.stopPropagation()}>
        <h3>🔐 {isRegistering ? 'Register' : 'Sign In Required'}</h3>
        <p>{isRegistering ? 'Create your account to get started.' : 'Please sign in to access your coaching data.'}</p>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required={isRegistering}
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="error-message" role="alert" aria-live="polite">
              <strong>⚠️ Error:</strong> {error}
            </div>
          )}
          
          <div className="form-actions">
            <button 
              type="button" 
              onClick={onCancel}
              disabled={isLoading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isLoading || !email || (isRegistering && !password)}
              className="btn-primary"
            >
              {isLoading ? (isRegistering ? 'Registering...' : 'Signing In...') : (isRegistering ? 'Register' : 'Sign In')}
            </button>
          </div>
        </form>

        <div className="login-options">
          <button 
            onClick={() => setIsRegistering(prev => !prev)}
            className="btn-link"
            disabled={isLoading}
          >
            {isRegistering ? 'Already have an account? Sign In' : "Don't have an account? Register"}
          </button>
          <button 
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="btn-google"
          >
            Sign In with Google
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPrompt
