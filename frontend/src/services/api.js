import { sanitizeBackendUrlValue } from './backendUrlValidation.js'

// API service for communicating with the backend server
// ✅ 使用環境變數配置，支持動態後端 URL
// ✅ 修復：提供 fallback 機制，確保即使環境變數有問題也能正常工作
const DEFAULT_BACKEND_URL = 'https://coach-backend.gamepig1976.workers.dev'

const getTestEnvBackendUrl = () => {
  if (typeof globalThis !== 'undefined' && typeof globalThis.__TEST_VITE_BACKEND_BASE_URL__ === 'string') {
    return globalThis.__TEST_VITE_BACKEND_BASE_URL__
  }
  return undefined
}

const getBackendBaseUrl = (overrideValue, options = {}) => {
  const rawEnvValue = typeof overrideValue === 'string'
    ? overrideValue
    : getTestEnvBackendUrl() ?? import.meta.env?.VITE_BACKEND_BASE_URL
  
  if (rawEnvValue) {
    const validation = sanitizeBackendUrlValue(rawEnvValue)
    if (validation.ok) {
      if (validation.protocol && validation.protocol !== 'https:') {
        console.warn('⚠️ VITE_BACKEND_BASE_URL should use HTTPS, got:', validation.protocol)
      }
      console.log('✅ Cleaned backend URL:', validation.cleanedOrigin)
      console.log('✅ VITE_BACKEND_BASE_URL:', validation.original || rawEnvValue)
      return validation.cleanedOrigin
    }

    console.error(`❌ Invalid VITE_BACKEND_BASE_URL (${validation.reason}):`, validation.cleanedInput)
    if (validation.original && validation.original !== validation.cleanedInput) {
      console.error('❌ Original value:', validation.original)
    }
    if (validation.hostname) {
      console.error('❌ Hostname:', validation.hostname)
    }
    console.warn(`⚠️ Using default backend URL: ${DEFAULT_BACKEND_URL}`)
    return DEFAULT_BACKEND_URL
  }
  
  const isProduction = typeof options.isProductionOverride === 'boolean'
    ? options.isProductionOverride
    : (typeof window !== 'undefined' && window.location?.hostname?.includes('pages.dev'))
  
  if (isProduction) {
    console.warn(`⚠️ VITE_BACKEND_BASE_URL not configured, using default: ${DEFAULT_BACKEND_URL}`)
    return DEFAULT_BACKEND_URL
  }
  
  const envValue = import.meta.env?.VITE_BACKEND_BASE_URL || 'undefined'
  const errorMessage = `
❌ VITE_BACKEND_BASE_URL 環境變數未設定

問題診斷：
- 當前環境：開發環境
- 環境變數值：${envValue}
- 影響：無法連接到後端 API

修復步驟：
1. 在 frontend/.env 檔案中設定：
   VITE_BACKEND_BASE_URL=https://coach-backend.gamepig1976.workers.dev
2. 重新啟動開發伺服器

詳細說明請參考：documents/google_oauth_client_issue_diagnosis.md
    `.trim()
    
  console.error('❌ VITE_BACKEND_BASE_URL not configured in development')
  console.error(errorMessage)
  throw new Error('VITE_BACKEND_BASE_URL not configured. Please set VITE_BACKEND_BASE_URL in frontend/.env file.')
}

const API_BASE_URL = `${getBackendBaseUrl()}/api/openai`
const API_ROOT_URL = `${getBackendBaseUrl()}/api`

class ApiService {
  constructor() {
    this.baseUrl = API_BASE_URL
    // ✅ 修復 #3: 添加並發調用防護
    this.validateSessionInFlight = false;
    this.validateSessionQueue = [];
  }

  // ===== SESSION MANAGEMENT =====

  getSessionToken() {
    return localStorage.getItem('sessionToken');
  }

  setSessionToken(token) {
    localStorage.setItem('sessionToken', token);
  }

  clearSessionToken() {
    localStorage.removeItem('sessionToken');
  }

  isAuthenticated() {
    return !!this.getSessionToken();
  }

  getAuthHeaders() {
    const token = this.getSessionToken();
    const headers = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    
    return headers;
  }

  async handleAuthError(response) {
    if (response.status === 401) {
      // Session expired, clear token and redirect to login
      this.clearSessionToken();
      
      // Dispatch custom event for app to handle
      window.dispatchEvent(new CustomEvent('sessionExpired'));
      
      throw new Error('Session expired. Please log in again.');
    }
  }

  // Session management API calls
  async login(email, password) {
    // Support both old (email-only) and new (email+password) login
    // Try new endpoint first if password is provided
    const endpoint = password ? `${API_ROOT_URL}/login-new` : `${API_ROOT_URL}/login`
    const body = password 
      ? { email, password } 
      : { email }
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      // ✅ 提供更詳細的錯誤訊息
      let errorMessage = errorData.message || 'Login failed'
      
      // ✅ 根據 HTTP 狀態碼提供更具體的錯誤訊息
      if (response.status === 401) {
        if (errorData.message?.includes('not found')) {
          errorMessage = 'User not found. Please sign up first or use email verification.'
        } else if (errorData.message?.includes('not verified')) {
          errorMessage = 'Email not verified. Please verify your email first.'
        } else if (errorData.message?.includes('Invalid password')) {
          errorMessage = 'Invalid password. Please try again.'
        } else {
          errorMessage = errorData.message || 'Invalid email or authentication failed. Please try again.'
        }
      } else if (response.status === 400) {
        errorMessage = errorData.message || 'Invalid request. Please check your email format.'
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      }
      
      throw new Error(errorMessage)
    }

    const data = await response.json();
    
    if (data.success && data.sessionToken) {
      this.setSessionToken(data.sessionToken);
    }

    return data;
  }

  async register(email, password) {
    const response = await fetch(`${API_ROOT_URL}/register-new`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      let errorMessage = errorData.message || 'Registration failed'
      
      if (response.status === 400) {
        errorMessage = errorData.message || 'Invalid request. Please check your email and password.'
      } else if (response.status >= 500) {
        errorMessage = 'Server error. Please try again later.'
      }
      
      throw new Error(errorMessage)
    }

    return await response.json();
  }

  async validateSession(skipClearOnFailure = false) {
    // ✅ 修復 #4: 防止並發 validateSession 調用
    // 如果已有一個驗證在進行，將此請求加入隊列
    if (this.validateSessionInFlight) {
      console.log('⏳ validateSession already in flight, queuing request...')
      return new Promise((resolve) => {
        this.validateSessionQueue.push((result) => {
          // 隊列中的請求使用相同的結果，無需重複調用
          resolve(result);
        });
      });
    }

    // 標記驗證開始
    this.validateSessionInFlight = true;

    try {
      const response = await fetch(`${API_ROOT_URL}/validate-session`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.ok) {
        const result = await response.json();

        // ✅ 修復 #5: 在返回前處理隊列中的所有請求
        // 讓所有等待中的請求都獲得相同的驗證結果
        const queue = this.validateSessionQueue;
        this.validateSessionQueue = [];
        queue.forEach(callback => callback(result));

        return result;
      }

      // ✅ 如果 skipClearOnFailure 為 true（例如剛登入後），不清除 token
      // 因為可能是暫時的 API 問題或 session token 還沒完全生效
      if (!skipClearOnFailure) {
        // If validation fails, clear the token
        console.log('❌ Session validation failed, clearing token (skipClearOnFailure=false)')
        this.clearSessionToken();
      } else {
        console.log('⚠️ Session validation failed, but preserving token (skipClearOnFailure=true)')
      }

      const result = { valid: false, authState: 'anonymous' };

      // ✅ 處理隊列中的所有請求
      const queue = this.validateSessionQueue;
      this.validateSessionQueue = [];
      queue.forEach(callback => callback(result));

      return result;
    } finally {
      // 標記驗證完成
      this.validateSessionInFlight = false;
    }
  }

  async refreshToken() {
    const response = await fetch(`${API_ROOT_URL}/refresh-token`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      await this.handleAuthError(response);
      throw new Error('Token refresh failed');
    }

    const data = await response.json();
    
    if (data.success && data.sessionToken) {
      this.setSessionToken(data.sessionToken);
    }

    return data;
  }

  async logout() {
    try {
      const response = await fetch(`${API_ROOT_URL}/logout`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({}),
      });

      // ✅ 修復：無論後端響應如何，都清除本地 token
      // 這樣即使 token 已過期或無效，用戶也能成功登出
      this.clearSessionToken();

      if (response.ok) {
        return response.json();
      }
      
      // ✅ 修復：即使後端返回 401（token 無效），也視為登出成功
      // 因為本地狀態已經清除，用戶已經登出
      if (response.status === 401) {
        console.log('⚠️ Logout: Session token was invalid, but logout completed locally');
        return { success: true, message: 'Logged out successfully (session was already invalid)' };
      }
      
      // 其他錯誤也視為登出成功（本地狀態已清除）
      return { success: true, message: 'Logged out locally' };
    } catch (error) {
      // ✅ 修復：即使網絡錯誤，也清除本地 token 並視為登出成功
      console.warn('⚠️ Logout API call failed, but clearing local token:', error);
      this.clearSessionToken();
      return { success: true, message: 'Logged out locally (API call failed)' };
    }
  }

  async getDashboard() {
    const response = await fetch(`${API_ROOT_URL}/dashboard`, {
      method: 'GET',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      // ✅ 如果是 401，先獲取錯誤訊息，但不立即清除 session
      // 讓調用方決定是否清除 session（通過 skipSessionExpired 參數）
      if (response.status === 401) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Session expired. Please log in again.')
      }
      await this.handleAuthError(response);
      throw new Error('Failed to get dashboard data');
    }

    return response.json();
  }

  // New email authentication endpoints
  async startAnalysisWithEmail(email, fileContent, fileName) {
    const response = await fetch(`${API_ROOT_URL}/start-analysis-with-email-direct`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        fileContent,
        fileName
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to start analysis')
    }

    return response.json()
  }

  async verifyEmailAndGetResults(token) {
    const response = await fetch(`${API_ROOT_URL}/verify-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        token
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to verify email')
    }

    const data = await response.json()
    
    // 🎯 KEY FIX: Store session token from email verification
    if (data.success && data.sessionToken) {
      console.log('✅ Storing session token from email verification')
      this.setSessionToken(data.sessionToken)
    }

    return data
  }

  async getMeetingById(meetingId) {
    const response = await fetch(`${API_ROOT_URL}/meetings/get-by-id`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        meetingId
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to get meeting data')
    }

    const result = await response.json()
    
    if (result.success && result.data) {
      return result.data
    } else {
      throw new Error(result.message || 'Failed to retrieve meeting data')
    }
  }

  async makeRequest(endpoint, data = null) {
    try {
      const url = `${this.baseUrl}${endpoint}`;
      const options = {
        method: data ? 'POST' : 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      };

      if (data) {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      return result.data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  async makeAbsoluteRequest(url, method = 'POST', data = null, requireAuth = false) {
    try {
      const options = {
        method,
        headers: requireAuth ? this.getAuthHeaders() : {
          'Content-Type': 'application/json',
        },
      };
      if (data && method !== 'GET') {
        options.body = JSON.stringify(data);
      }

      const response = await fetch(url, options);
      
      // Handle authentication errors (401)
      if (requireAuth && response.status === 401) {
        await this.handleAuthError(response);
      }
      
      // Parse JSON response
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, throw a more descriptive error
        throw new Error(`Failed to parse response: ${response.status} ${response.statusText}`);
      }

      // Check if the API returned an error
      if (result.success === false) {
        throw new Error(result.error || 'API request failed');
      }

      // If response is not OK but we got here, check for other error cases
      if (!response.ok && result.success !== false) {
        throw new Error(result.error || `Request failed with status ${response.status}: ${response.statusText}`);
      }

      return result.data ?? result; // some endpoints may return data at root
    } catch (error) {
      console.error('API absolute request error:', error);
      // Re-throw with more context if it's not already an Error object
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(error?.message || 'Unknown error occurred');
    }
  }

  // Summarize text and extract structured information
  async summarizeText(text, userId = null) {
    try {
      const url = `${this.baseUrl}/summarize-text`;
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          ...(userId && { userId })
        })
      };

      const response = await fetch(url, options);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'API request failed');
      }

      return result;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // ---------- Protected endpoints (require authentication) ----------
  async listMeetings() {
    return this.makeAbsoluteRequest(`${API_ROOT_URL}/meetings/list`, 'POST', {}, true);
  }

  async listClients() {
    return this.makeAbsoluteRequest(`${API_ROOT_URL}/clients/list`, 'GET', null, true);
  }

  async updateClient(clientId, updates) {
    return this.makeAbsoluteRequest(`${API_ROOT_URL}/clients/${clientId}`, 'PUT', updates, true);
  }

  async listReels() {
    return this.makeAbsoluteRequest(`${API_ROOT_URL}/reels/list`, 'POST', {}, true);
  }

  async favoriteReel(id, isFavorite) {
    return this.makeAbsoluteRequest(`${API_ROOT_URL}/reels/favorite`, 'POST', { id, isFavorite });
  }

  async updateReel(update) {
    return this.makeAbsoluteRequest(`${API_ROOT_URL}/reels/update`, 'PUT', update);
  }

  async deleteReel(id) {
    return this.makeAbsoluteRequest(`${API_ROOT_URL}/reels/delete`, 'DELETE', { id });
  }

  // Tag Management Methods (protected)
  async listTags() {
    return this.makeAbsoluteRequest(`${API_ROOT_URL}/tags`, 'GET', null, true);
  }

  async createTag(tagData) {
    return this.makeAbsoluteRequest(`${API_ROOT_URL}/tags`, 'POST', tagData, true);
  }

  async updateTag(tagId, updates) {
    return this.makeAbsoluteRequest(`${API_ROOT_URL}/tags/${tagId}`, 'PUT', updates);
  }

  async deleteTag(tagId) {
    return this.makeAbsoluteRequest(`${API_ROOT_URL}/tags/${tagId}`, 'DELETE');
  }

  async getClientTags(clientId) {
    return this.makeAbsoluteRequest(`${API_ROOT_URL}/clients/${clientId}/tags`, 'GET');
  }

  async assignTagToClient(clientId, tagId) {
    return this.makeAbsoluteRequest(`${API_ROOT_URL}/clients/${clientId}/tags`, 'POST', { tag_id: tagId });
  }

  async removeTagFromClient(clientId, tagId) {
    return this.makeAbsoluteRequest(`${API_ROOT_URL}/clients/${clientId}/tags/${tagId}`, 'DELETE');
  }

  // Generate mindmap from summary
  async generateMindMap(summary, isDiscovery) {
    return this.makeRequest('/generate-mindmap', {
      summary,
      type: isDiscovery ? 'sales' : 'consulting'
    });
  }

  // Generate next meeting preparation
  async generateNextMeetingPrep(userId, clientId) {
    return this.makeRequest('/generate-next-meeting-prep', {
      userId,
      clientId
    });
  }







  // Get resources list from Perplexity
  async getResourcesList(prompt) {
    try {
      const response = await fetch(`${API_ROOT_URL}/perplexity/resources-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to get resources list');
      }
      
      return result;
    } catch (error) {
      console.error('Resources list API error:', error);
      throw error;
    }
  }

  // Generate resources list and save to database
  async generateResourcesList(prompt, meetingId) {
    try {
      const response = await fetch(`${API_ROOT_URL}/resources-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, meetingId })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate resources list');
      }
      
      return result;
    } catch (error) {
      console.error('Generate resources list API error:', error);
      throw error;
    }
  }

  // Convert MP4 to transcript
  async convertMp4ToTranscript(file) {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_ROOT_URL}/media/convert-mp4-to-transcript`, {
        method: 'POST',
        body: formData
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Transcription failed');
      }
      
      return result;
    } catch (error) {
      console.error('Transcription API error:', error);
      throw error;
    }
  }

  // ===== USER PREFERENCES =====

  // Save user's client table column preferences
  async saveUserColumnPreferences(visibleColumns) {
    try {
      const response = await fetch(`${API_ROOT_URL}/user/column-preferences`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({
          columns: Object.keys(visibleColumns).filter(col => visibleColumns[col])
        })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to save column preferences');
      }

      return result;
    } catch (error) {
      console.error('Save column preferences API error:', error);
      throw error;
    }
  }

  // Load user's client table column preferences
  async getUserColumnPreferences() {
    try {
      const response = await fetch(`${API_ROOT_URL}/user/column-preferences`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load column preferences');
      }

      return result.data || [];
    } catch (error) {
      console.error('Load column preferences API error:', error);
      throw error;
    }
  }

  // ===== CLIENT ASSIGNMENT =====

  // Assign meeting to client (new or existing)
  async assignMeetingToClient(meetingId, clientAction, clientName = null, clientId = null) {
    try {
      const response = await fetch(`${API_ROOT_URL}/assign-meeting-to-client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          meetingId,
          clientAction,
          clientName,
          clientId
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to assign meeting to client')
      }

      return await response.json()
    } catch (error) {
      console.error('Assign meeting to client API error:', error)
      throw error
    }
  }

  // ===== AUTHENTICATED MEETING ANALYSIS =====

  // Analyze meeting for authenticated user
  async analyzeAuthenticatedMeeting(analysisData) {
    try {
      // ✅ 添加 token 檢查保護（防止 token 在請求發送前被清除）
      const token = this.getSessionToken()
      if (!token) {
        console.error('❌ analyzeAuthenticatedMeeting: Session token is missing')
        throw new Error('Session token is missing. Please log in again.')
      }
      
      // ✅ 檢查 file 是否存在（防止 analysisData.file.name 錯誤）
      if (!analysisData.file && !analysisData.fileName) {
        console.error('❌ analyzeAuthenticatedMeeting: File or fileName is required')
        throw new Error('File or fileName is required')
      }
      
      // ✅ 獲取 fileName（支援兩種格式）
      const fileName = analysisData.file?.name || analysisData.fileName
      
      // ✅ 在發送請求前再次檢查 token（防止競態條件）
      const headers = this.getAuthHeaders()
      if (!headers.Authorization) {
        console.error('❌ analyzeAuthenticatedMeeting: Authorization header could not be created')
        throw new Error('Authorization header could not be created. Please log in again.')
      }
      
      console.log('🔍 analyzeAuthenticatedMeeting: Sending request with token:', token ? 'exists' : 'missing')
      console.log('🔍 analyzeAuthenticatedMeeting: Request headers:', {
        hasAuthorization: !!headers.Authorization,
        authorizationPreview: headers.Authorization ? headers.Authorization.substring(0, 30) + '...' : 'missing'
      })

      // ✅ 調試：顯示發送的請求數據（敏感資料已遮蔽）
      console.log('🔍 analyzeAuthenticatedMeeting: Request body:', {
        fileName: fileName,
        uploadType: analysisData.uploadType,
        clientOption: analysisData.clientOption,
        clientName: analysisData.clientName,
        clientEmail: analysisData.clientEmail,  // 顯示 email 以便調試
        hasClientId: !!analysisData.clientId,
        meetingDate: analysisData.meetingDate,
        fileContentLength: analysisData.fileContent?.length || 0
      })

      const response = await fetch(`${API_ROOT_URL}/analyze-authenticated-meeting`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          fileContent: analysisData.fileContent,
          fileName: fileName,
          uploadType: analysisData.uploadType,
          clientOption: analysisData.clientOption,
          clientName: analysisData.clientName,
          clientEmail: analysisData.clientEmail,  // ✅ 修復：添加 clientEmail 欄位
          clientId: analysisData.clientId,
          meetingDate: analysisData.meetingDate
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('❌ analyzeAuthenticatedMeeting: Request failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        })
        
        // ✅ 如果是 401 錯誤，提供更詳細的錯誤訊息
        if (response.status === 401) {
          if (errorData.message?.includes('Missing or invalid authorization header')) {
            console.error('🚨 analyzeAuthenticatedMeeting: Authorization header issue detected')
            console.error('🔍 Current token:', token ? 'exists' : 'missing')
            console.error('🔍 Request headers:', headers)
          }
        }
        
        throw new Error(errorData.message || 'Failed to start analysis')
      }

      const result = await response.json()
      console.log('✅ analyzeAuthenticatedMeeting: Request successful:', result)
      return result
    } catch (error) {
      console.error('❌ Analyze authenticated meeting API error:', error)
      throw error
    }
  }

  // Get meeting analysis status
  async getMeetingStatus(meetingId) {
    try {
      const response = await fetch(`${API_ROOT_URL}/meetings/${meetingId}/status`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Failed to get meeting status')
      }

      const data = await response.json()
      return data.status // Return just the status string
    } catch (error) {
      console.error('Get meeting status API error:', error)
      throw error
    }
  }
}

export const apiService = new ApiService();
export { getBackendBaseUrl, DEFAULT_BACKEND_URL }; 
