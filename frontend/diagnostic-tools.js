/**
 * 診斷工具 - 用於追蹤認證問題
 * 
 * 使用方法：
 * 1. 在瀏覽器 Console 中執行：copy(診斷工具代碼)
 * 2. 或者將此文件內容貼到 Console 中執行
 * 3. 然後執行登入和分析操作，觀察日誌輸出
 */

// ===== 1. localStorage 追蹤工具 =====
(function() {
  console.log('🔍 診斷工具已載入：localStorage 追蹤')
  
  const originalSetItem = localStorage.setItem.bind(localStorage)
  const originalRemoveItem = localStorage.removeItem.bind(localStorage)
  const originalGetItem = localStorage.getItem.bind(localStorage)
  
  localStorage.setItem = function(key, value) {
    if (key === 'sessionToken') {
      const stack = new Error().stack
      const caller = stack.split('\n')[2]?.trim() || 'unknown'
      console.trace('🔵 SET sessionToken:', {
        token: value ? value.substring(0, 20) + '...' : 'null',
        length: value?.length || 0,
        caller: caller,
        timestamp: new Date().toISOString()
      })
    }
    return originalSetItem(key, value)
  }
  
  localStorage.removeItem = function(key) {
    if (key === 'sessionToken') {
      const stack = new Error().stack
      const caller = stack.split('\n')[2]?.trim() || 'unknown'
      console.trace('🔴 REMOVE sessionToken:', {
        caller: caller,
        timestamp: new Date().toISOString()
      })
    }
    return originalRemoveItem(key)
  }
  
  localStorage.getItem = function(key) {
    if (key === 'sessionToken') {
      const value = originalGetItem(key)
      const stack = new Error().stack
      const caller = stack.split('\n')[2]?.trim() || 'unknown'
      console.log('🟢 GET sessionToken:', {
        exists: !!value,
        length: value?.length || 0,
        caller: caller,
        timestamp: new Date().toISOString()
      })
      return value
    }
    return originalGetItem(key)
  }
  
  console.log('✅ localStorage 追蹤已啟用')
})()

// ===== 2. 環境變數檢查工具 =====
(function() {
  console.log('🔍 檢查環境變數配置...')
  
  const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL
  console.log('📋 環境變數狀態:', {
    'VITE_BACKEND_BASE_URL': backendUrl || '❌ 未設定（禁止使用 localhost:8787 fallback，詳見 PROJECT_RULES.md）',
    '當前使用的 URL': backendUrl || '❌ 未設定',
    '是否為 localhost': backendUrl ? backendUrl.includes('localhost') : null,
    '警告': !backendUrl ? '⚠️ 未設定 VITE_BACKEND_BASE_URL，必須明確設定（禁止使用 localhost:8787）' : '✅ 已正確設定'
  })
  
  if (!backendUrl) {
    console.warn('⚠️ 建議：在 Cloudflare Pages 環境變數中設定 VITE_BACKEND_BASE_URL')
  }
})()

// ===== 3. Network 請求追蹤工具 =====
(function() {
  console.log('🔍 Network 請求追蹤已啟用')
  
  const originalFetch = window.fetch
  window.fetch = function(...args) {
    const url = args[0]
    const options = args[1] || {}
    const headers = options.headers || {}
    
    // 檢查 analyze-authenticated-meeting 請求
    if (typeof url === 'string' && url.includes('analyze-authenticated-meeting')) {
      console.log('📡 analyze-authenticated-meeting 請求:', {
        url: url,
        method: options.method || 'GET',
        hasAuthHeader: !!headers.Authorization || !!headers.authorization,
        authHeaderValue: headers.Authorization || headers.authorization || '❌ 缺失',
        timestamp: new Date().toISOString()
      })
    }
    
    // 檢查 validateSession 請求
    if (typeof url === 'string' && url.includes('validate-session')) {
      console.log('🔐 validateSession 請求:', {
        url: url,
        method: options.method || 'GET',
        hasAuthHeader: !!headers.Authorization || !!headers.authorization,
        timestamp: new Date().toISOString()
      })
    }
    
    // 檢查所有 401 響應
    return originalFetch.apply(this, args).then(response => {
      if (response.status === 401) {
        console.error('❌ 收到 401 響應:', {
          url: url,
          status: response.status,
          statusText: response.statusText,
          timestamp: new Date().toISOString()
        })
      }
      return response
    })
  }
  
  console.log('✅ Network 請求追蹤已啟用')
})()

// ===== 4. Session Expired 事件追蹤 =====
window.addEventListener('sessionExpired', (event) => {
  console.error('🚨 sessionExpired 事件觸發:', {
    timestamp: new Date().toISOString(),
    stack: new Error().stack
  })
})

// ===== 5. 診斷報告生成工具 =====
window.generateDiagnosticReport = function() {
  const report = {
    timestamp: new Date().toISOString(),
    environment: {
      backendUrl: import.meta.env.VITE_BACKEND_BASE_URL || null,
      isLocalhost: !import.meta.env.VITE_BACKEND_BASE_URL || import.meta.env.VITE_BACKEND_BASE_URL.includes('localhost'),
      userAgent: navigator.userAgent
    },
    localStorage: {
      sessionToken: localStorage.getItem('sessionToken') ? '存在' : '❌ 不存在',
      tokenLength: localStorage.getItem('sessionToken')?.length || 0
    },
    network: {
      note: '請檢查 Network 面板中的請求詳情'
    }
  }
  
  console.log('📊 診斷報告:', report)
  return report
}

console.log('✅ 所有診斷工具已載入')
console.log('💡 提示：執行 generateDiagnosticReport() 生成診斷報告')

