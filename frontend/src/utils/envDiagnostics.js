/**
 * 環境變數診斷工具
 * 用於診斷和報告 VITE_BACKEND_BASE_URL 環境變數配置問題
 */

import { isProduction as checkIsProduction, isDevelopment } from '../config/environment'

/**
 * 檢查環境變數配置狀態
 * @returns {Object} 診斷結果
 */
export function checkEnvironmentVariables() {
  const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL
  const isProduction = checkIsProduction()
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  
  const allViteEnvVars = Object.keys(import.meta.env).filter(key => key.startsWith('VITE_'))
  
  return {
    backendUrl: backendUrl || null,
    isConfigured: !!backendUrl,
    isProduction,
    isLocalhost,
    currentUrl: window.location.href,
    hostname: window.location.hostname,
    allViteEnvVars,
    diagnostic: {
      status: backendUrl ? 'ok' : 'error',
      message: backendUrl 
        ? '✅ 環境變數已正確設定' 
        : '❌ 環境變數未設定',
      recommendation: backendUrl 
        ? null 
        : isProduction
          ? '請在 Cloudflare Pages 環境變數中設定 VITE_BACKEND_BASE_URL'
          : '請在 frontend/.env 檔案中設定 VITE_BACKEND_BASE_URL'
    }
  }
}

/**
 * 生成詳細的診斷報告
 * @returns {Object} 診斷報告
 */
export function generateDiagnosticReport() {
  const check = checkEnvironmentVariables()
  
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      currentUrl: check.currentUrl,
      hostname: check.hostname,
      isProduction: check.isProduction,
      isLocalhost: check.isLocalhost
    },
    configuration: {
      backendUrl: check.backendUrl,
      isConfigured: check.isConfigured,
      allViteEnvVars: check.allViteEnvVars
    },
    diagnostic: check.diagnostic,
    fixSteps: check.isConfigured ? null : check.isProduction ? [
      '1. 登入 Cloudflare Dashboard: https://dash.cloudflare.com',
      '2. 前往：Pages → coach-rocks-frontend → Settings → Environment Variables',
      '3. 新增變數：',
      '   - 名稱：VITE_BACKEND_BASE_URL',
      '   - 值：https://coach-backend.gamepig1976.workers.dev',
      '   - 環境：Production 和 Preview',
      '4. 重新部署前端應用'
    ] : [
      '1. 在 frontend/.env 檔案中設定：',
      '   VITE_BACKEND_BASE_URL=https://coach-backend.gamepig1976.workers.dev',
      '2. 重新啟動開發伺服器'
    ]
  }
  
  return report
}

/**
 * 在 Console 中輸出診斷報告
 */
export function logDiagnosticReport() {
  const report = generateDiagnosticReport()
  
  console.group('🔍 環境變數診斷報告')
  console.log('📋 時間:', report.timestamp)
  console.log('🌐 環境:', report.environment)
  console.log('⚙️ 配置:', report.configuration)
  console.log('📊 診斷:', report.diagnostic)
  
  if (report.fixSteps) {
    console.group('🔧 修復步驟')
    report.fixSteps.forEach(step => console.log(step))
    console.groupEnd()
  }
  
  console.groupEnd()
  
  return report
}

/**
 * 檢查並在 Console 中顯示環境變數狀態（用於開發時快速檢查）
 */
export function quickCheck() {
  const check = checkEnvironmentVariables()
  
  if (check.isConfigured) {
    console.log('✅ VITE_BACKEND_BASE_URL:', check.backendUrl)
  } else {
    console.error('❌ VITE_BACKEND_BASE_URL 未設定')
    console.warn('📋 診斷資訊:', check)
    logDiagnosticReport()
  }
  
  return check
}

// 在開發模式下自動執行快速檢查
if (import.meta.env.DEV) {
  // 延遲執行，確保所有模組都已載入
  setTimeout(() => {
    quickCheck()
  }, 1000)
}

