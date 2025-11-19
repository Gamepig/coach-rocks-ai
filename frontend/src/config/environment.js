/**
 * Environment Configuration Module
 *
 * 統一的環境判斷邏輯，避免硬編碼
 *
 * 使用方式：
 * import { isProduction, isDevelopment, getEnvironment } from '@/config/environment'
 *
 * 配置方式：
 * 1. 環境變數 VITE_ENVIRONMENT: 'development' | 'production' | 'staging'
 * 2. 環境變數 VITE_PRODUCTION_DOMAINS: 逗號分隔的生產域名列表（如：'coach.rocks,app.coach.rocks'）
 * 3. 自動偵測：基於 import.meta.env.MODE 或 hostname
 */

/**
 * 從環境變數獲取生產域名列表
 */
function getProductionDomains() {
  const envDomains = import.meta.env.VITE_PRODUCTION_DOMAINS || ''

  // 預設生產域名列表（可配置）
  const defaultDomains = [
    'pages.dev',           // Cloudflare Pages（舊）
    'coach.rocks',         // 主域名
    'app.coach.rocks',     // 子域名
    'coachrocksai.com'     // 備用域名
  ]

  // 如果環境變數有配置，使用環境變數
  if (envDomains) {
    return envDomains.split(',').map(d => d.trim()).filter(Boolean)
  }

  return defaultDomains
}

/**
 * 判斷當前 hostname 是否為生產環境
 */
function isProductionHostname(hostname) {
  if (!hostname) return false

  const productionDomains = getProductionDomains()

  // 檢查是否匹配任何生產域名
  return productionDomains.some(domain => hostname.includes(domain))
}

/**
 * 獲取當前環境
 * @returns {'development' | 'production' | 'staging' | 'test'}
 */
export function getEnvironment() {
  // 1. 優先使用明確指定的環境變數
  const explicitEnv = import.meta.env.VITE_ENVIRONMENT
  if (explicitEnv) {
    return explicitEnv
  }

  // 2. 測試環境判斷
  if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'test') {
    return 'test'
  }

  // 3. 基於 Vite mode 判斷
  const viteMode = import.meta.env.MODE
  if (viteMode === 'production') {
    return 'production'
  }
  if (viteMode === 'development') {
    return 'development'
  }

  // 4. 基於 hostname 判斷（瀏覽器環境）
  if (typeof window !== 'undefined' && window.location) {
    const hostname = window.location.hostname

    // localhost 或 127.0.0.1 = development
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development'
    }

    // 匹配生產域名 = production
    if (isProductionHostname(hostname)) {
      return 'production'
    }
  }

  // 5. 默認為 development
  return 'development'
}

/**
 * 是否為生產環境
 */
export function isProduction() {
  return getEnvironment() === 'production'
}

/**
 * 是否為開發環境
 */
export function isDevelopment() {
  return getEnvironment() === 'development'
}

/**
 * 是否為測試環境
 */
export function isTest() {
  return getEnvironment() === 'test'
}

/**
 * 是否為 Staging 環境
 */
export function isStaging() {
  return getEnvironment() === 'staging'
}

/**
 * 獲取當前環境的顯示名稱
 */
export function getEnvironmentLabel() {
  const env = getEnvironment()
  const labels = {
    development: '開發環境',
    production: '生產環境',
    staging: 'Staging 環境',
    test: '測試環境'
  }
  return labels[env] || env
}

/**
 * 環境配置工具（調試用）
 */
export function logEnvironmentInfo() {
  if (!isDevelopment()) return

  console.log('🌍 Environment Info:', {
    environment: getEnvironment(),
    environmentLabel: getEnvironmentLabel(),
    viteMode: import.meta.env.MODE,
    viteProd: import.meta.env.PROD,
    viteDev: import.meta.env.DEV,
    hostname: typeof window !== 'undefined' ? window.location?.hostname : 'N/A',
    productionDomains: getProductionDomains(),
    explicitEnv: import.meta.env.VITE_ENVIRONMENT || 'not set'
  })
}

// 開發環境自動打印環境資訊
if (isDevelopment() && typeof window !== 'undefined') {
  setTimeout(() => logEnvironmentInfo(), 1000)
}
