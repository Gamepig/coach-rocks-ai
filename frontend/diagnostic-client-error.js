// 客戶端錯誤診斷工具
// 請客戶在瀏覽器 Console 中執行此腳本，並提供輸出結果

(async function diagnoseClientError() {
  console.log('🔍 開始客戶端錯誤診斷...')
  console.log('')
  
  // 1. 環境資訊
  console.log('📋 環境資訊:')
  console.log('  瀏覽器:', navigator.userAgent)
  console.log('  當前 URL:', window.location.href)
  console.log('  時間:', new Date().toISOString())
  console.log('')
  
  // 2. 檢查 sessionToken
  const token = localStorage.getItem('sessionToken')
  console.log('📋 Session Token 狀態:')
  console.log('  存在:', !!token)
  console.log('  長度:', token?.length || 0)
  console.log('  預覽:', token ? token.substring(0, 20) + '...' : 'null')
  console.log('')
  
  if (!token) {
    console.error('❌ 沒有 sessionToken，請先登入')
    return
  }
  
  // 3. 檢查環境變數
  const backendUrl = import.meta.env.VITE_BACKEND_BASE_URL || 'https://coach-backend.gamepig1976.workers.dev'
  console.log('📋 環境變數:')
  console.log('  VITE_BACKEND_BASE_URL:', backendUrl)
  console.log('  是否為 localhost:', backendUrl.includes('localhost'))
  console.log('')
  
  // 4. 檢查 apiService（如果存在）
  let apiService = null
  if (window.apiService) {
    apiService = window.apiService
    console.log('📋 apiService 狀態:')
    console.log('  存在:', true)
    console.log('  getSessionToken:', typeof apiService.getSessionToken === 'function')
    console.log('  getAuthHeaders:', typeof apiService.getAuthHeaders === 'function')
    console.log('  當前 Token (apiService):', apiService.getSessionToken() ? 'exists' : 'missing')
    
    const headers = apiService.getAuthHeaders()
    console.log('  Request Headers (apiService):', {
      hasAuthorization: !!headers.Authorization,
      authorizationPreview: headers.Authorization ? headers.Authorization.substring(0, 30) + '...' : '❌ 缺失'
    })
  } else {
    console.log('⚠️ apiService 不存在於 window 對象上')
  }
  console.log('')
  
  // 5. 測試 OPTIONS 預檢請求
  console.log('🧪 測試 OPTIONS 預檢請求...')
  const apiUrl = `${backendUrl}/api/analyze-authenticated-meeting`
  
  try {
    const optionsResponse = await fetch(apiUrl, {
      method: 'OPTIONS',
      headers: {
        'Origin': window.location.origin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    })
    
    console.log('📥 OPTIONS Response Status:', optionsResponse.status, optionsResponse.statusText)
    const optionsHeaders = Object.fromEntries(optionsResponse.headers.entries())
    console.log('📥 OPTIONS Response Headers:', {
      'Access-Control-Allow-Origin': optionsHeaders['access-control-allow-origin'] || '❌ 缺失',
      'Access-Control-Allow-Methods': optionsHeaders['access-control-allow-methods'] || '❌ 缺失',
      'Access-Control-Allow-Headers': optionsHeaders['access-control-allow-headers'] || '❌ 缺失',
      'Access-Control-Allow-Credentials': optionsHeaders['access-control-allow-credentials'] || '❌ 缺失'
    })
    
    if (optionsResponse.status === 200 || optionsResponse.status === 204) {
      console.log('✅ OPTIONS 預檢請求成功')
    } else {
      console.error('❌ OPTIONS 預檢請求失敗')
    }
  } catch (error) {
    console.error('❌ OPTIONS 請求錯誤:', error)
  }
  console.log('')
  
  // 6. 測試 POST 請求（模擬實際流程）
  console.log('🧪 測試 POST 請求（模擬實際流程）...')
  
  const testData = {
    fileContent: 'Test meeting transcript content for client error diagnosis.',
    fileName: 'test-client-error-diagnosis.txt',
    uploadType: 'document',
    clientOption: 'new',
    clientName: 'Test Client Error Diagnosis',
    clientId: null,
    meetingDate: new Date().toISOString().split('T')[0]
  }
  
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }
  
  console.log('📡 發送 POST 請求到:', apiUrl)
  console.log('📡 Request Headers:', {
    hasAuthorization: !!headers.Authorization,
    authorizationPreview: headers.Authorization ? headers.Authorization.substring(0, 30) + '...' : '❌ 缺失',
    contentType: headers['Content-Type']
  })
  
  try {
    const postResponse = await fetch(apiUrl, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(testData)
    })
    
    console.log('📥 POST Response Status:', postResponse.status, postResponse.statusText)
    console.log('📥 POST Response Headers:', Object.fromEntries(postResponse.headers.entries()))
    
    const postResponseData = await postResponse.json().catch(() => ({ error: 'Failed to parse JSON' }))
    console.log('📥 POST Response Data:', postResponseData)
    
    if (postResponse.status === 401) {
      console.error('❌ 收到 401 錯誤:', postResponseData)
      if (postResponseData.message?.includes('Missing or invalid authorization header')) {
        console.error('🚨 確認問題: Authorization header 缺失或無效')
        console.error('')
        console.error('🔍 診斷建議:')
        console.error('  1. 檢查 Request Headers 是否有 Authorization')
        console.error('  2. 檢查 token 是否在發送請求前被清除')
        console.error('  3. 檢查 CORS 預檢請求是否正確')
        console.error('  4. 檢查瀏覽器緩存設置')
        console.error('  5. 嘗試清除瀏覽器緩存並重新登入')
      }
    } else if (postResponse.ok) {
      console.log('✅ POST 請求成功')
    } else {
      console.error('❌ POST 請求失敗:', postResponseData)
    }
  } catch (error) {
    console.error('❌ POST 請求錯誤:', error)
    console.error('🔍 錯誤詳情:', {
      message: error.message,
      stack: error.stack
    })
  }
  console.log('')
  
  // 7. 檢查 Network 請求（提示）
  console.log('💡 請檢查 Network 面板:')
  console.log('  1. 打開 DevTools → Network 面板')
  console.log('  2. 找到 analyze-authenticated-meeting 請求')
  console.log('  3. 檢查 Request Headers 是否有 Authorization')
  console.log('  4. 檢查是否有 OPTIONS 預檢請求')
  console.log('  5. 檢查 Response Status 和 Body')
  console.log('')
  
  // 8. 生成診斷報告
  console.log('📋 診斷報告摘要:')
  console.log('  Token 存在:', !!token)
  console.log('  後端 URL:', backendUrl)
  console.log('  apiService 存在:', !!apiService)
  console.log('  請將此輸出提供給開發團隊進行進一步分析')
  
  return {
    tokenExists: !!token,
    backendUrl: backendUrl,
    apiServiceExists: !!apiService,
    timestamp: new Date().toISOString()
  }
})()

console.log('💡 提示: 執行診斷腳本後，請將 Console 輸出提供給開發團隊')

