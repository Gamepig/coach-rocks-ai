import { useState, useEffect, useRef } from 'react'
import './App.css'
import mammoth from 'mammoth'
import mermaid from 'mermaid'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import html2canvas from 'html2canvas'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'
import { apiService } from './services/api'
import { useAuth } from './contexts/AuthContext'
import { quickCheck } from './utils/envDiagnostics'
import { isProduction } from './config/environment'
import LoginForm from './components/auth/LoginForm'
import RegisterForm from './components/auth/RegisterForm'
import GoogleLoginButton from './components/auth/GoogleLoginButton'

// Import new components
// FileUploadSelector removed - upload functionality handled by MeetingUploadModal
import FileUpload from './components/FileUpload/FileUpload'
import AnalysisProgress from './components/AnalysisProgress/AnalysisProgress'
import TopNav from './components/TopNav/TopNav'
import MeetingsTable from './components/Tables/MeetingsTable'
import ClientsTable from './components/Tables/ClientsTable'
import ReelsTable from './components/Tables/ReelsTable'
import MainDashboard from './components/MainDashboard/MainDashboard'
import AnalyticsDashboard from './components/AnalyticsDashboard/AnalyticsDashboard'
import LoginPrompt from './components/LoginPrompt/LoginPrompt'
// LandingPage removed - redirecting directly to dashboard
// import LandingPage from './components/LandingPage/LandingPage'
import LoginPage from './components/LoginPage/LoginPage'
import TopBar from './components/TopBar/TopBar'
import MeetingDetailView from './components/MeetingDetailView/MeetingDetailView'
import ClientSelectionModal from './components/ClientSelectionModal/ClientSelectionModal'
import ClientDetails from './components/ClientDetails/ClientDetails'
import OnboardingWizard from './components/Onboarding/OnboardingWizard'
import Integrations from './components/Settings/Integrations'


function App() {
  // Use new authentication context
  const { 
    isAuthenticated: authIsAuthenticated, 
    user: authUser, 
    isInitialized: authInitialized,
    authState 
  } = useAuth()
  
  const [selectedFile, setSelectedFile] = useState(null)
  const [fileContent, setFileContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [summary, setSummary] = useState('')
  const [mindMap, setMindMap] = useState('')
  const [coachingAdvice, setCoachingAdvice] = useState('')
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isDiscovery, setIsDiscovery] = useState(null)
  const [followUpEmail, setFollowUpEmail] = useState('')
  const mindMapRef = useRef(null)
  const [clientActionItems, setClientActionItems] = useState('')
  const [coachActionItems, setCoachActionItems] = useState('')
  const [clientName, setClientName] = useState('')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [clientProfession, setClientProfession] = useState('')
  const [clientCompany, setClientCompany] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [painPoint, setPainPoint] = useState('')
  const [goal, setGoal] = useState('')
  const [coachSuggestion, setCoachSuggestion] = useState('')
  const [salesTechniqueAdvice, setSalesTechniqueAdvice] = useState('')
  const [showClientPrompt, setShowClientPrompt] = useState(false)
  const [reelsScripts, setReelsScripts] = useState('')
  const [selectedSocialMediaOption, setSelectedSocialMediaOption] = useState(null)
  const [nextMeetingPrep, setNextMeetingPrep] = useState(null)
  const [isGeneratingNextMeetingPrep, setIsGeneratingNextMeetingPrep] = useState(false)
  const [isGeneratingMindMap, setIsGeneratingMindMap] = useState(false)
  const [mindMapError, setMindMapError] = useState('')
  const [showMindMapButton, setShowMindMapButton] = useState(true)
  const [showSocialMediaButton, setShowSocialMediaButton] = useState(true)
  const [showFollowUpEmailButton, setShowFollowUpEmailButton] = useState(true)
  const [fontStyle, setFontStyle] = useState('AI-generated')
  const [backgroundImage, setBackgroundImage] = useState('AI-generated')
  const [colorTheme, setColorTheme] = useState('#000000')
  const [colorThemeMode, setColorThemeMode] = useState('AI-generated')
  const [selectedSocialMediaIndex, setSelectedSocialMediaIndex] = useState(null)
  const [isGeneratingIGPrompt, setIsGeneratingIGPrompt] = useState(false)
  const [igImagePrompt, setIgImagePrompt] = useState('')
  const [igImageBase64, setIgImageBase64] = useState('')
  const [isGeneratingIGImage, setIsGeneratingIGImage] = useState(false)
  const [igImageError, setIgImageError] = useState('')
  const [socialMediaContentError, setSocialMediaContentError] = useState('')
  const [selectedMenu, setSelectedMenu] = useState('Summary')
  const [mindMapGenerated, setMindMapGenerated] = useState(false)
  const [followUpEmailGenerated, setFollowUpEmailGenerated] = useState(false)
  const [reelsScriptsGenerated, setReelsScriptsGenerated] = useState(false)
  const [uploadType, setUploadType] = useState(null)

  const [isTranscribing, setIsTranscribing] = useState(false)
  const [userEmail, setUserEmail] = useState('')
  const [showAnalysisProgress, setShowAnalysisProgress] = useState(false)
  const [transcriptionError, setTranscriptionError] = useState('')
  const [resourcesList, setResourcesList] = useState([])
  const [isGeneratingResources, setIsGeneratingResources] = useState(false)
  const [resourcesGenerated, setResourcesGenerated] = useState(false)
  const [resourcesError, setResourcesError] = useState('')
  const [meetingId, setMeetingId] = useState('')
  const [dashboardStats, setDashboardStats] = useState(null)  // ✅ 新增：儲存 API 返回的統計數據
  const hasDefaultRoutedRef = useRef(false)
  // 導航保護：標記使用者明確的導航意圖，防止自動路由覆寫
  const userNavigationRef = useRef(null)
  // OAuth 回調狀態追蹤：避免依賴 URL 參數（容易被清除）
  const oauthCallbackRef = useRef(false)
  // OAuth 錯誤狀態追蹤：防止 checkAuthStatus 覆蓋 OAuth 錯誤處理
  const oauthErrorRef = useRef(false)
  // 登入操作追蹤：防止 checkAuthStatus 在登入後立即執行並覆蓋狀態
  const loginInProgressRef = useRef(false)
  // ✅ 修復 BUG-2：分析進行中狀態追蹤，防止默認路由在分析過程中觸發
  const analysisInProgressRef = useRef(false)

  // ✅ Phase 2：速率限制狀態管理
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null)
  const [secondsUntilNextAnalysis, setSecondsUntilNextAnalysis] = useState(0)
  const [canSubmitAnalysis, setCanSubmitAnalysis] = useState(true)

  // ✅ 修復問題：將模態框狀態提升到父組件，避免 AnalyticsDashboard 卸載時模態框消失
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState(null)

  // Top navigation visibility and data
  const [hasAnalysis, setHasAnalysis] = useState(false)
  const [activeTopTab, setActiveTopTab] = useState(null) // null shows dashboard
  const [meetings, setMeetings] = useState([])
  const [isLoadingMeetings, setIsLoadingMeetings] = useState(false)
  const [clients, setClients] = useState([])
  const [isLoadingClients, setIsLoadingClients] = useState(false)
  const [reels, setReels] = useState([])
  const [isLoadingReels, setIsLoadingReels] = useState(false)
  
  // Tag management state
  const [tags, setTags] = useState([])
  const [isLoadingTags, setIsLoadingTags] = useState(false)
  const [tagsError, setTagsError] = useState(null)
  
  // Authentication state - use new AuthContext
  // Landing page removed - show LoginPrompt by default when not authenticated
  const [showLoginPrompt, setShowLoginPrompt] = useState(true)
  // Landing page removed - redirecting directly to dashboard
  // const [showLandingPage, setShowLandingPage] = useState(true)
  const [showLoginPage, setShowLoginPage] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  
  // Use AuthContext values (fallback to local state for backward compatibility)
  // ✅ 修復：定義本地狀態以支援 setCurrentUser 和 setIsAuthenticated
  const [isAuthenticated, setIsAuthenticated] = useState(authIsAuthenticated || false)
  const [currentUser, setCurrentUser] = useState(authUser || null)
  
  // 環境變數診斷檢查（應用啟動時執行）
  useEffect(() => {
    // 在生產環境中檢查環境變數配置
    if (isProduction()) {
      const check = quickCheck()
      if (!check.isConfigured) {
        console.warn('⚠️ 生產環境環境變數未設定，Google OAuth 功能將無法使用')
      }
    }
  }, [])

  // ✅ 同步 AuthContext 的狀態變化到本地狀態
  useEffect(() => {
    setIsAuthenticated(authIsAuthenticated || false)
  }, [authIsAuthenticated])
  
  useEffect(() => {
    setCurrentUser(authUser || null)
  }, [authUser])

  // ✅ Phase 2：速率限制倒計時效果
  useEffect(() => {
    if (!canSubmitAnalysis && lastAnalysisTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - lastAnalysisTime
        const remaining = Math.max(0, 30 - Math.floor(elapsed / 1000))
        setSecondsUntilNextAnalysis(remaining)

        if (remaining === 0) {
          setCanSubmitAnalysis(true)
          clearInterval(interval)
          console.log('⏱️ Rate limiting expired, user can submit again')
        }
      }, 1000)

      return () => clearInterval(interval)
    }
  }, [canSubmitAnalysis, lastAnalysisTime])

  // Legacy OAuth callback state (will be removed after full migration)
  const getInitialOAuthFlag = () => {
    const params = new URLSearchParams(window.location.search)
    return params.get('oauth') === 'success' && !!params.get('token')
  }
  const [isOAuthCallbackActive, setIsOAuthCallbackActive] = useState(getInitialOAuthFlag)
  
  // Client detail view state
  const [selectedClient, setSelectedClient] = useState(null) // Selected client for single client view
  const [selectedMeeting, setSelectedMeeting] = useState(null) // Selected meeting for detail view
  const [clientViewMode, setClientViewMode] = useState('all-clients') // 'all-clients' or 'single-client'
  const [selectedClientForDetails, setSelectedClientForDetails] = useState(null) // Selected client for details page
  const [showClientDetails, setShowClientDetails] = useState(false) // Show client details view
  const [clientMeetings, setClientMeetings] = useState([]) // Meetings for the selected client
  
  // Client selection modal state
  const [showClientSelectionModal, setShowClientSelectionModal] = useState(false)
  const [verificationData, setVerificationData] = useState(null)
  const [isLoadingClientsModal, setIsLoadingClientsModal] = useState(false)

  // Authentication handlers - use new AuthContext
  const { login: authLogin, register: authRegister, logout: authLogout } = useAuth()
  
  const handleLogin = async (email, password) => {
    try {
      console.log('🔐 Attempting login for:', email)
      // ✅ 關鍵修復：標記登入操作進行中，防止 checkAuthStatus 覆蓋登入狀態
      loginInProgressRef.current = true
      
      // Use new AuthContext login
      await authLogin(email, password)
      
      // ✅ 關鍵修復：確保設置認證狀態和用戶資訊
      setIsAuthenticated(true)
      
      // ✅ 關鍵修復：確保導向到 Dashboard
      setActiveTopTab(null)
      hasDefaultRoutedRef.current = true
      
      // ✅ 關鍵修復：載入 Dashboard 數據（如果失敗，不影響登入成功）
      try {
        await loadDashboardData(true)
        console.log('✅ Dashboard data loaded successfully')
      } catch (dashboardError) {
        console.warn('⚠️ Dashboard data loading failed, but login was successful:', dashboardError)
        // 不拋出錯誤，因為登入已經成功
      }
      
      // ✅ 關鍵修復：只有在所有操作成功後才關閉登入 UI
      setShowLoginPrompt(false)
      // Landing page removed
      setShowLoginPage(false)
      
      console.log('✅ Login successful, redirected to Dashboard')
    } catch (error) {
      console.error('❌ Login failed:', error)
      // ✅ 登入失敗時清除登入進行中標記並確保登入提示顯示
      loginInProgressRef.current = false
      setShowLoginPrompt(true)
      throw error
    } finally {
      // ✅ 延遲清除登入進行中標記，確保所有狀態更新完成
      setTimeout(() => {
        loginInProgressRef.current = false
        console.log('✅ Login process completed, cleared loginInProgressRef')
      }, 2000)
    }
  }

  const handleRegister = async (email, password) => {
    try {
      console.log('📝 Registration requested for:', email)
      await authRegister(email, password)
      setShowRegisterForm(false)
      setShowLoginPrompt(true)
    } catch (error) {
      console.error('❌ Registration failed:', error)
      throw error
    }
  }

  // Note: LoginPage now only handles Google OAuth redirect
  // OAuth callback is handled in useEffect above

  // Handle navigation to login page - show new login form
  const handleGetStarted = () => {
    // Landing page removed - directly show login prompt
    setShowLoginPage(false)
    setShowLoginPrompt(true)
  }

  // Landing page removed - no longer needed
  // const handleBackToLanding = () => { ... }

  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out')
      // Use new AuthContext logout (this handles session clearing)
      await authLogout()
      
      // Call backend logout API
      try {
        await apiService.logout()
      } catch (apiError) {
        // Backend logout API may fail, but we still want to clear local state
        console.warn('⚠️ Backend logout API failed:', apiError)
      }

      // Clear application state
      setMeetings([])
      setClients([])
      setReels([])
      setActiveTopTab(null)
      // Reset default routing idempotence flag
      hasDefaultRoutedRef.current = false
      
      // ✅ 關鍵修復：清除 OAuth callback 相關狀態，確保登出後正確顯示 LoginPrompt
      oauthCallbackRef.current = false
      setIsOAuthCallbackActive(false)
      loginInProgressRef.current = false
      
      // Landing page removed - show LoginPrompt instead
      setShowLoginPage(false)
      setShowLoginPrompt(true)

      console.log('✅ Logout complete')
    } catch (error) {
      console.error('❌ Logout error:', error)
      // Even if logout fails, clear local state
      // ✅ 關鍵修復：清除 OAuth callback 相關狀態
      oauthCallbackRef.current = false
      setIsOAuthCallbackActive(false)
      loginInProgressRef.current = false
      
      // Landing page removed - show LoginPrompt instead
      setShowLoginPage(false)
      setShowLoginPrompt(true)
    }
  }

  // ✅ Phase 2：速率限制更新處理
  const handleAnalysisSubmitted = (secondsRemaining = 0) => {
    console.log('⏱️ Analysis submitted, setting rate limit. Seconds remaining:', secondsRemaining)
    setLastAnalysisTime(Date.now())
    setCanSubmitAnalysis(false)
    setSecondsUntilNextAnalysis(secondsRemaining || 30)
  }

  // ✅ Phase 2：處理 429 速率限制錯誤
  const handleRateLimitError = (nextAvailableIn) => {
    console.log('⏱️ Rate limit error (429), seconds remaining:', nextAvailableIn)
    setLastAnalysisTime(Date.now() - (30 - nextAvailableIn) * 1000)
    setCanSubmitAnalysis(false)
    setSecondsUntilNextAnalysis(nextAvailableIn)
  }

  // Handle onboarding completion
  const handleOnboardingComplete = async () => {
    console.log('🎉 Onboarding completed')

    try {
      // Update currentUser to mark onboarding as completed
      if (currentUser) {
        setCurrentUser({
          ...currentUser,
          onboarding_completed: true
        })
      }

      // Load dashboard data to show main app
      console.log('📊 Loading dashboard after onboarding completion')
      await loadDashboardData()
      setActiveTopTab(null) // Show dashboard tab
    } catch (error) {
      console.error('❌ Error after onboarding completion:', error)
      // Still proceed to show main app even if dashboard load fails
      setActiveTopTab(null)
    }
  }

  // Client selection handler for email verification flow
  const handleClientSelected = async (selectionData) => {
    try {
      console.log('📋 Client selection made:', selectionData)
      setIsLoading(true)
      
      // First load existing clients if needed (for the modal)
      if (selectionData.type === 'existing' && clients.length === 0) {
        setIsLoadingClientsForModal(true)
        try {
          const clientsResponse = await apiService.loadClients()
          if (clientsResponse.success) {
            setClients(clientsResponse.data)
          }
        } catch (error) {
          console.error('Failed to load clients for modal:', error)
        } finally {
          setIsLoadingClientsForModal(false)
        }
      }
      
      // Call the backend API to assign meeting to client
      const response = await apiService.assignMeetingToClient(
        selectionData.verificationData.meetingId,
        selectionData.type,
        selectionData.clientName,
        selectionData.clientId
      )
      
      if (response.success) {
        console.log('✅ Meeting assigned to client successfully')
        
        // Close the modal
        setShowClientSelectionModal(false)
        setVerificationData(null)
        
        // Load the meeting data and show the results
        const { verificationData } = selectionData
        if (verificationData.token) {
          const verificationResponse = await apiService.verifyEmailAndGetResults(verificationData.token)
          if (verificationResponse.success && verificationResponse.sessionToken) {
            console.log('✅ Session token stored from client selection flow')
          }
        }
        
        // Load meeting data
        const meetingResponse = await apiService.getMeetingById(verificationData.meetingId)
        if (meetingResponse.success && meetingResponse.data) {
          const data = meetingResponse.data
          
          // Populate all the state with meeting data
          setSummary(data.summary.summary || '')
          setClientName(data.summary.clientName || selectionData.clientName || '')
          setMeetingTitle(data.summary.meetingTitle || '')
          setPainPoint(data.summary.painPoint || '')
          setGoal(data.summary.goal || '')
          setClientProfession(data.summary.clientProfession || '')
          setClientCompany(data.summary.clientCompany || '')
          setTargetAudience(data.summary.targetAudience || '')
          setCoachSuggestion(data.summary.coachSuggestions?.join(', ') || '')
          setSalesTechniqueAdvice(data.summary.salesTechniqueAdvice?.join(', ') || '')
          setCoachingAdvice(data.summary.coachingAdvice?.join(', ') || '')
          setClientActionItems(data.summary.actionItemsClient?.join(', ') || '')
          setCoachActionItems(data.summary.actionItemsCoach?.join(', ') || '')
          setFollowUpEmail(data.followUpEmail?.content || '')
          setReelsScripts(data.socialMediaContent?.reels || [])
          setMindMap(data.mindMap || '')
          setNextMeetingPrep(data.nextMeetingPrep)
          setIsDiscovery(data.isDiscovery)
          setMeetingId(verificationData.meetingId)
          
          // Load existing resources list if available
          if (data.resourcesList && Array.isArray(data.resourcesList) && data.resourcesList.length > 0) {
            setResourcesList(data.resourcesList)
            setResourcesGenerated(true)
          }
          
          // Set analysis as complete and show Analysis tab
          setHasAnalysis(true)
          setActiveTopTab('Analysis')
          
          console.log('✅ Client selection flow complete - showing analysis results')
        }
      } else {
        throw new Error(response.message || 'Failed to assign meeting to client')
      }
      
    } catch (error) {
      console.error('❌ Error in client selection:', error)
      alert('Failed to assign meeting to client. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSessionExpiredLogin = () => {
    console.log('⏰ Session expired, showing login prompt')
    setIsAuthenticated(false)
    setCurrentUser(null)
    setShowLoginPrompt(true)
  }

  // Check authentication status on app load
  useEffect(() => {
    const checkAuthStatus = async () => {
      // ✅ 如果 OAuth 錯誤已發生，不執行 checkAuthStatus（避免覆蓋錯誤處理）
      if (oauthErrorRef.current) {
        console.log('⏭️ Skipping checkAuthStatus: OAuth error occurred')
        return
      }
      
      // ✅ 如果登入操作正在進行中，不執行 checkAuthStatus（避免覆蓋登入狀態）
      if (loginInProgressRef.current) {
        console.log('⏭️ Skipping checkAuthStatus: Login in progress')
        return
      }
      
      // ✅ 關鍵修復：如果 OAuth callback 正在處理，不執行 checkAuthStatus（避免覆蓋 OAuth 登入狀態）
      if (oauthCallbackRef.current || isOAuthCallbackActive) {
        console.log('⏭️ Skipping checkAuthStatus: OAuth callback in progress')
        return
      }
      
      // ✅ 檢測是否為後台登入端口（5174）
      const isBackendLoginPort = window.location.port === '5174'
      
      try {
        if (apiService.isAuthenticated()) {
          console.log('🔍 Checking existing session...')
          // ✅ 修復 #2a: checkAuthStatus 中傳遞 skipClearOnFailure=true
          // 這避免在驗證期間清除令牌，特別是在 OAuth callback 執行後
          const validation = await apiService.validateSession(true)

          // ✅ 關鍵修復：再次檢查 OAuth callback 狀態（異步操作完成後）
          if (oauthCallbackRef.current || isOAuthCallbackActive || loginInProgressRef.current) {
            console.log('⏭️ Skipping checkAuthStatus result: OAuth callback or login in progress')
            return
          }
          
          if (validation.valid) {
            console.log('✅ Session valid, user authenticated')
            setIsAuthenticated(true)
            setCurrentUser(validation.user)
            // ✅ 關鍵修復：確保關閉所有登入相關 UI
            // Landing page removed
            setShowLoginPage(false)
            setShowLoginPrompt(false)
            await loadDashboardData()
          } else {
            console.log('❌ Session invalid, clearing auth')
            apiService.clearSessionToken()
            setIsAuthenticated(false)
            // ✅ Landing page removed - always show LoginPrompt when not authenticated
            if (!showLoginPrompt) {
              setShowLoginPrompt(true)
            }
            setShowLoginPage(false)
          }
        } else {
          // ✅ 關鍵修復：再次檢查 OAuth callback 狀態（異步操作完成後）
          if (oauthCallbackRef.current || isOAuthCallbackActive || loginInProgressRef.current) {
            console.log('⏭️ Skipping checkAuthStatus result: OAuth callback or login in progress')
            return
          }
          
          // No session token
          // ✅ Landing page removed - always show LoginPrompt when not authenticated
          if (!showLoginPrompt) {
            setShowLoginPrompt(true)
          }
          setShowLoginPage(false)
        }
      } catch (error) {
        // ✅ 關鍵修復：再次檢查 OAuth callback 狀態（錯誤處理時）
        if (oauthCallbackRef.current || isOAuthCallbackActive || loginInProgressRef.current) {
          console.log('⏭️ Skipping checkAuthStatus error handling: OAuth callback or login in progress')
          return
        }
        
        console.error('❌ Auth check failed:', error)
        setIsAuthenticated(false)
        // ✅ Landing page removed - always show LoginPrompt when not authenticated
        if (!showLoginPrompt) {
          setShowLoginPrompt(true)
        }
        setShowLoginPage(false)
      }
    }

    checkAuthStatus()

    // Listen for session expiration events
    const handleSessionExpiredEvent = () => handleSessionExpiredLogin()
    window.addEventListener('sessionExpired', handleSessionExpiredEvent)

    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpiredEvent)
    }
  }, [])

  // Load dashboard data for authenticated users
  const loadDashboardData = async (skipSessionExpired = false) => {
    try {
      // ✅ 開始計時
      const startTime = performance.now()
      performance.mark('dashboard-load-start')

      console.log('📊 Loading dashboard data...')
      const dashboardData = await apiService.getDashboard()
      console.log('✅ Dashboard data loaded:', dashboardData)

      // ✅ 記錄 API 響應時間
      const apiTime = performance.now() - startTime
      performance.mark('dashboard-api-complete')
      performance.measure('dashboard-api-duration', 'dashboard-load-start', 'dashboard-api-complete')
      console.log(`⏱️ Dashboard API response time: ${apiTime.toFixed(2)}ms`)

      // ✅ 立即設定 dashboardStats，讓數字可以立即顯示（不等待其他數據）
      // ✅ 修復 BUG-3：包含完整的 data 對象（quickStats + recentActivity + quickActions）
      if (dashboardData?.data) {
        console.log('🔍 DEBUG App.jsx: dashboardData.data keys:', Object.keys(dashboardData.data))
        console.log('🔍 DEBUG App.jsx: recentActivity exists?', !!dashboardData.data.recentActivity)
        console.log('🔍 DEBUG App.jsx: recentActivity length:', dashboardData.data.recentActivity?.length || 0)

        const statsData = {
          totalMeetings: dashboardData.data.quickStats?.totalMeetings || 0,
          clientsServed: dashboardData.data.quickStats?.clientsServed || 0,
          reelsGenerated: dashboardData.data.quickStats?.reelsGenerated || 0,
          thisWeekUploads: dashboardData.data.quickStats?.thisWeekUploads || 0,
          recentActivity: dashboardData.data.recentActivity || [],  // 👈 包含 recentActivity
          quickActions: dashboardData.data.quickActions || []
        }
        setDashboardStats(statsData)
        const statsSetTime = performance.now() - startTime
        console.log(`⏱️ Stats displayed time: ${statsSetTime.toFixed(2)}ms`)
        console.log('✅ Dashboard stats set immediately:', statsData)
        console.log('📊 Included recentActivity items:', statsData.recentActivity.length)
        console.log('✅ BUG-3 FIX: recentActivity passed to component:', statsData.recentActivity)
      }

      // Load all the individual data collections for the dashboard（異步，不阻塞）
      console.log('📊 Loading meetings, clients, and reels data...')
      const loadStartTime = performance.now()
      await Promise.all([
        loadMeetings(),    // 用於 Recent Activity 列表
        loadClients(),     // 用於其他功能
        loadReels()        // 用於 Recent Activity 列表
      ])
      const loadTime = performance.now() - loadStartTime
      const totalTime = performance.now() - startTime

      performance.mark('dashboard-load-complete')
      performance.measure('dashboard-total-duration', 'dashboard-load-start', 'dashboard-load-complete')
      console.log(`⏱️ Total data load time: ${loadTime.toFixed(2)}ms`)
      console.log(`⏱️ Total dashboard load time: ${totalTime.toFixed(2)}ms`)
      console.log('✅ All dashboard data loaded successfully')
    } catch (error) {
      console.error('❌ Failed to load dashboard:', error)
      // ✅ 如果 skipSessionExpired 為 true（例如剛登入後），不觸發 session expired 處理
      // 因為可能是暫時的 API 問題或 session token 還沒完全生效
      if (!skipSessionExpired && error.message.includes('Session expired')) {
        handleSessionExpiredLogin()
      } else if (skipSessionExpired) {
        console.log('⚠️ Dashboard load failed after login, but skipping session expired handling (may be temporary)')
      }
    }
  }

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        htmlLabels: true,
        curve: 'basis'
      }
    })

    // Check for URL parameters from email verification and OAuth callback FIRST
    // ✅ 關鍵修復：優先處理 URL 參數（OAuth callback），避免 session validation 覆蓋 OAuth 登入狀態
    console.log('🔍 useEffect running, checking URL parameters...')
    console.log('🔍 Current URL:', window.location.href)
    const urlParams = new URLSearchParams(window.location.search)
    const verified = urlParams.get('verified')
    const analysisStatus = urlParams.get('analysis')
    const meetingId = urlParams.get('meetingId')
    const error = urlParams.get('error')
    const clientId = urlParams.get('clientId')
    const viewType = urlParams.get('view')
    
    // OAuth callback parameters
    const oauthToken = urlParams.get('token')
    const oauth = urlParams.get('oauth')
    const provider = urlParams.get('provider')
    
    console.log('🔍 URL Parameters:')
    console.log('  - verified:', verified, '(type:', typeof verified, ')')
    console.log('  - analysisStatus:', analysisStatus, '(type:', typeof analysisStatus, ')')
    console.log('  - meetingId:', meetingId, '(type:', typeof meetingId, ')')
    console.log('  - error:', error, '(type:', typeof error, ')')
    console.log('  - clientId:', clientId, '(type:', typeof clientId, ')')
    console.log('  - viewType:', viewType, '(type:', typeof viewType, ')')
    console.log('  - oauth:', oauth, '(type:', typeof oauth, ')')
    console.log('  - provider:', provider, '(type:', typeof provider, ')')
    console.log('  - oauthToken:', oauthToken ? 'present' : 'missing')
    
    // Handle OAuth callback (priority check - happens before email verification)
    if (oauth === 'success' && oauthToken) {
      setIsOAuthCallbackActive(true)
      // ✅ 使用 ref 追蹤 OAuth 回調狀態，避免依賴 URL 參數
      oauthCallbackRef.current = true
      console.log('✅ OAuth callback detected! Processing...')
      console.log('🔐 Provider:', provider)
      console.log('📧 User Email:', urlParams.get('userEmail'))

      try {
        // ✅ 檢查 localStorage 可用性
        let isLocalStorageAvailable = true
        try {
          const testKey = '__localStorage_test__'
          localStorage.setItem(testKey, 'test')
          localStorage.removeItem(testKey)
          console.log('✅ localStorage is available')
        } catch (e) {
          isLocalStorageAvailable = false
          console.error('❌ localStorage is not available (likely private/incognito mode):', e.message)
        }

        if (!isLocalStorageAvailable) {
          // localStorage 不可用，顯示友好的錯誤訊息
          const errorMsg = 'OAuth login requires localStorage to be enabled. Please disable private/incognito mode or enable storage.'
          console.error('❌ ' + errorMsg)
          
          // ✅ 關鍵修復：立即還原 OAuth callback 狀態
          setIsOAuthCallbackActive(false)
          oauthCallbackRef.current = false
          
          // 標記 OAuth 錯誤狀態
          oauthErrorRef.current = true
          setShowLoginPrompt(true)
          
          // ✅ 關鍵修復：清除 URL 參數，允許使用者重試
          setTimeout(() => {
            const cleanUrl = window.location.pathname + (window.location.hash || '')
            window.history.replaceState({}, document.title, cleanUrl)
          }, 100)
          return
        }

        // Save session token
        apiService.setSessionToken(oauthToken)
        console.log('✅ Session token saved from OAuth callback')

        // ⚠️ 延遲清除 URL 參數，等待所有狀態都更新完成
        // 暫不清除，讓 validateAndLoad() 完成後再清除

        // ✅ 關鍵修復：標記 OAuth 登入操作進行中，防止 checkAuthStatus 和其他邏輯覆蓋
        loginInProgressRef.current = true
        
        // ✅ 關鍵修復：隱藏登入相關頁面，確保 OAuth callback 期間顯示主應用程式
        // 注意：isAuthenticated 會由 AuthContext 更新，這裡不需要手動設置
        setShowLoginPrompt(false)
        setShowLoginPage(false)
        
        // ✅ 確保導向到 Dashboard（原本的首頁）
        // activeTopTab === null 表示顯示 Dashboard（AnalyticsDashboard）
        setActiveTopTab(null)
        console.log('✅ Set activeTopTab to null (Dashboard)')
        
        // Get user data from URL parameters or validate session
        const userName = urlParams.get('userName')
        const userEmail = urlParams.get('userEmail')
        const userAvatar = urlParams.get('userAvatar')
        
        if (userEmail) {
          setCurrentUser({
            email: userEmail,
            name: userName || userEmail,
            avatar_url: userAvatar || null,
            auth_provider: provider || 'google'
          })
        }
        
        // Validate session and load dashboard data
        const validateAndLoad = async () => {
          try {
            console.log('✅ OAuth callback completed, validating session...')
            // ✅ 防止預設路由邏輯在 OAuth callback 後自動導向到最新 meeting
            hasDefaultRoutedRef.current = true
            // ✅ 關鍵修復：使用 skipClearOnFailure=true，避免在 OAuth callback 後清除 session token
            const validation = await apiService.validateSession(true)
            if (validation.valid && validation.user) {
              console.log('✅ Session validated, user profile:', validation.user)
              setCurrentUser(validation.user)
            } else {
              // ✅ 即使驗證失敗，也不清除 session token（因為剛登入，可能是暫時的 API 問題）
              console.log('⚠️ Session validation returned invalid, but keeping token (may be temporary)')
            }
            
            // Ensure login pages are hidden after validation
            // Landing page removed
            setShowLoginPage(false)
            // ✅ 關鍵修復：確保不顯示 LoginPrompt（因為用戶已經登入）
            setShowLoginPrompt(false)
            
            // ✅ 再次確保導向到 Dashboard（原本的首頁）
            setActiveTopTab(null)
            
            // ✅ 關鍵修復：使用 skipSessionExpired=true，避免在 OAuth callback 後觸發 session expired
            await loadDashboardData(true)
            console.log('✅ Dashboard data loaded after OAuth login')
            console.log('✅ Redirected to Dashboard (原本的首頁)')
          } catch (error) {
            console.error('❌ Session validation failed after OAuth callback:', error)
            // Even on error, ensure we don't show login pages
            // Landing page removed
            setShowLoginPage(false)
            // ✅ 關鍵修復：即使錯誤也確保不顯示 LoginPrompt（因為用戶已經登入）
            setShowLoginPrompt(false)
            // ✅ 即使錯誤也確保導向到 Dashboard
            setActiveTopTab(null)
          } finally {
            // ✅ 延遲清除登入進行中標記，確保所有狀態更新完成
            setTimeout(() => {
              loginInProgressRef.current = false
              console.log('✅ OAuth login process completed, loginInProgressRef cleared')
            }, 2000)
            // ✅ 不要立即清除 isOAuthCallbackActive，讓它保持到渲染完成
            // 使用 setTimeout 延遲清除，確保 React 已完成渲染和 AuthContext 狀態更新
            // 延長到 2 秒，確保 AuthContext 的異步狀態更新完成
            setTimeout(() => {
              // ✅ 只有在 AuthContext 的狀態已更新（isAuthenticated 為 true）時才清除
              // 否則保持 isOAuthCallbackActive 為 true，確保頁面正常顯示
              if (authIsAuthenticated) {
                setIsOAuthCallbackActive(false)
                console.log('✅ OAuth callback processing completed, isOAuthCallbackActive cleared (AuthContext state updated)')
              } else {
                console.log('⚠️ AuthContext state not updated yet, keeping isOAuthCallbackActive true')
                // 再等待 1 秒後清除
                setTimeout(() => {
                  setIsOAuthCallbackActive(false)
                  console.log('✅ OAuth callback processing completed, isOAuthCallbackActive cleared (delayed)')
                }, 1000)
              }
              // ✅ oauthCallbackRef 保持為 true，作為持久化標記
              // 這樣即使 isOAuthCallbackActive 被清除，條件渲染仍然可以工作
            }, 2000)
            
            // ✅ 延遲清除 URL 參數，確保所有狀態都已更新
            // 使用 setTimeout 確保 React 已完成狀態更新和重新渲染
            setTimeout(() => {
              const cleanUrl = window.location.pathname + (window.location.hash || '')
              window.history.replaceState({}, document.title, cleanUrl)
              console.log('✅ URL parameters cleared after validation')
            }, 100)
          }
        }

        validateAndLoad()
      } catch (oauthProcessingError) {
        console.error('❌ OAuth callback handling failed:', oauthProcessingError)
        setIsOAuthCallbackActive(false)
      }
      
      // Exit early - don't process email verification if OAuth callback is present
      return
    }
    
    // Handle OAuth errors
    if (error && (error.includes('google_auth_error') || error.includes('oauth') || error.includes('invalid_state') || error.includes('token_exchange_failed') || error.includes('profile_fetch_failed'))) {
      console.error('❌ OAuth error:', error)
      const errorDetails = urlParams.get('details')
      console.error('Error details:', errorDetails)

      // ✅ 詳細的錯誤訊息和修復建議
      let userFriendlyError = 'Google login failed. Please try again.'
      let fixSuggestion = ''

      if (error.includes('invalid_state')) {
        userFriendlyError = 'Login session expired or invalid. This may happen if you waited too long or opened multiple login tabs.'
        fixSuggestion = 'Try logging in again. Make sure you only have one login tab open.'
      } else if (error.includes('token_exchange_failed')) {
        userFriendlyError = 'Failed to exchange authentication code. This is usually a temporary server issue.'
        fixSuggestion = 'Try logging in again in a moment.'
      } else if (error.includes('profile_fetch_failed')) {
        userFriendlyError = 'Failed to fetch your Google profile. Please check your Google account.'
        fixSuggestion = 'Try logging in again, or contact support if the problem persists.'
      } else if (error.includes('google_auth_error')) {
        userFriendlyError = 'Google authentication error. ' + (errorDetails ? errorDetails : 'Unknown error occurred.')
        fixSuggestion = 'Please try again or use a different browser.'
      }

      console.log('ℹ️ User-friendly error:', userFriendlyError)
      console.log('ℹ️ Fix suggestion:', fixSuggestion)

      // ✅ 關鍵修復：如果用戶已經登入，不清除登入狀態，只清除錯誤參數
      // 這解決了「登入後還要求登入」的問題
      if (apiService.isAuthenticated() || isAuthenticated) {
        console.log('✅ User already authenticated, ignoring OAuth error and clearing URL parameters')
        // Clear URL parameters only
        const cleanUrl = window.location.pathname + (window.location.hash || '')
        window.history.replaceState({}, document.title, cleanUrl)
        // 不清除登入狀態，不顯示 LoginPrompt
        oauthErrorRef.current = false
        return
      }

      // ✅ 只有在用戶未登入時才顯示 LoginPrompt
      // 標記 OAuth 錯誤狀態，防止 checkAuthStatus 覆蓋
      oauthErrorRef.current = true

      // Clear URL parameters
      const cleanUrl = window.location.pathname + (window.location.hash || '')
      window.history.replaceState({}, document.title, cleanUrl)

      // ✅ 確保顯示 LoginPrompt
      setShowLoginPage(false)
      setShowLoginPrompt(true)
      console.log('✅ OAuth error: Showing LoginPrompt instead of landing page (user not authenticated)')
      console.log('  - Error message:', userFriendlyError)
      console.log('  - Suggestion:', fixSuggestion)

      // Exit early
      return
    }
    
    // ✅ 關鍵修復：只有在沒有 OAuth callback 時才執行 session validation
    // 這樣可以避免 session validation 覆蓋 OAuth 登入狀態
    if (!oauthCallbackRef.current && !isOAuthCallbackActive && !loginInProgressRef.current) {
      // ✅ Check for existing session token in localStorage on mount
      console.log('🔍 useEffect running, checking for existing session...')
      if (!isAuthenticated && apiService.getSessionToken()) {
        console.log('✅ Found existing session token, validating...')
        // ✅ 修復 #1: 傳遞 skipClearOnFailure=true，避免在檢查 session 時清除令牌
        // 這防止 useEffect 的驗證干擾 OAuth callback 的令牌保留
        apiService.validateSession(true)
          .then((validation) => {
            // ✅ 再次檢查：如果 OAuth callback 或登入操作在驗證期間開始，不覆蓋狀態
            if (oauthCallbackRef.current || isOAuthCallbackActive || loginInProgressRef.current) {
              console.log('⏭️ Skipping session validation result: OAuth callback or login in progress')
              return
            }
            console.log('✅ Session validation response:', validation)
            if (validation.valid && validation.user) {
              console.log('✅ Session validated, user profile:', validation.user)
              setIsAuthenticated(true)
              setCurrentUser(validation.user)
              // Landing page removed
              setActiveTopTab(null)
            } else {
              console.log('⚠️ Session validation returned invalid:', validation)
            }
          })
          .catch((error) => {
            // ✅ 再次檢查：如果 OAuth callback 或登入操作在錯誤處理期間開始，不覆蓋狀態
            if (oauthCallbackRef.current || isOAuthCallbackActive || loginInProgressRef.current) {
              console.log('⏭️ Skipping session validation error handling: OAuth callback or login in progress')
              return
            }
            console.error('❌ Session validation failed:', error)
            apiService.clearSessionToken()
            setIsAuthenticated(false)
          })
      } else {
        console.log('🔍 No session token or already authenticated')
      }
    } else {
      console.log('⏭️ Skipping session check: OAuth callback or login in progress')
    }
    
    const emailVerifiedComplete = (verified === 'true' && analysisStatus === 'complete' && meetingId)
    console.log('🔍 Condition check (relaxed):', emailVerifiedComplete, {
      verified, analysisStatus, meetingId, clientId, viewType
    })

    if (emailVerifiedComplete) {
      console.log('✅ EMAIL VERIFICATION DETECTED! Processing...')
      console.log('📧 Meeting ID:', meetingId)
      console.log('🔍 Analysis Status:', analysisStatus)
      
      // Set a loading state for email verification
      setIsLoading(true)
      
      // Check if we have a token in the URL (from email verification)
      const token = urlParams.get('token')
      if (token) {
        console.log('🔐 Found verification token, processing...')
        // Verify the email and get session token
        const verifyAndLoadData = async () => {
          try {
            const verificationResponse = await apiService.verifyEmailAndGetResults(token)
            console.log('✅ Email verification response:', verificationResponse)

            if (verificationResponse.success && verificationResponse.sessionToken) {
              console.log('✅ Session token stored from email verification')
              // Session token is automatically stored by the API service

              // NEW: Check if client selection is required
              if (verificationResponse.requiresClientSelection) {
                console.log('📋 Client selection required - showing modal')
                setVerificationData({
                  email: verificationResponse.email || 'User',
                  meetingId: verificationResponse.meetingData.id,
                  analysisData: verificationResponse.meetingData,
                  token
                })
                setIsLoading(false)
                setShowClientSelectionModal(true)
                return // Exit early to show modal instead of loading data
              }
              console.log('✅ Meeting already has client assignment - proceeding to load data')
            }
          } catch (error) {
            console.error('❌ Email verification failed:', error)
          }
        }
        verifyAndLoadData().then(async () => {
          // After email verification, validate the session and update auth state
          try {
            if (apiService.isAuthenticated()) {
              console.log('✅ Email verification completed, validating session...')
              // ✅ 修復 #2b: Email verification 後傳遞 skipClearOnFailure=true
              // 避免在剛驗證 email 後清除令牌
              const validation = await apiService.validateSession(true)
              if (validation.valid) {
                console.log('✅ Session validated, updating auth state')
                setIsAuthenticated(true)
                setCurrentUser(validation.user)
                await loadDashboardData()
              }
            }
          } catch (error) {
            console.error('❌ Session validation failed after email verification:', error)
          }
        })
      }
      
      // Fetch the meeting data and populate the state
      const loadMeetingData = async () => {
        try {
          const response = await apiService.getMeetingById(meetingId)
          const data = response?.data ?? response
          if (data) {
            
            // Populate all the state with meeting data
            setSummary(data.summary.summary || '')
            setClientName(data.summary.clientName || '')
            setMeetingTitle(data.summary.meetingTitle || '')
            setPainPoint(data.summary.painPoint || '')
            setGoal(data.summary.goal || '')
            setClientProfession(data.summary.clientProfession || '')
            setClientCompany(data.summary.clientCompany || '')
            setTargetAudience(data.summary.targetAudience || '')
            setCoachSuggestion(data.summary.coachSuggestions?.join(', ') || '')
            setSalesTechniqueAdvice(data.summary.salesTechniqueAdvice?.join(', ') || '')
            setCoachingAdvice(data.summary.coachingAdvice?.join(', ') || '')
            setClientActionItems(data.summary.actionItemsClient?.join(', ') || '')
            setCoachActionItems(data.summary.actionItemsCoach?.join(', ') || '')
            setFollowUpEmail(data.followUpEmail?.content || '')
            setReelsScripts(data.socialMediaContent?.reels || [])
            setMindMap(data.mindMap || '')
            setNextMeetingPrep(data.nextMeetingPrep)
            setIsDiscovery(data.isDiscovery)
            setMeetingId(meetingId) // Set meetingId here
            
            // Load existing resources list if available
            if (data.resourcesList && Array.isArray(data.resourcesList) && data.resourcesList.length > 0) {
              setResourcesList(data.resourcesList)
              setResourcesGenerated(true)
              console.log('Loaded existing resources list:', data.resourcesList.length, 'items')
            }
            
            // Mark analysis ready and default to Clients tab
            setHasAnalysis(true)
            setActiveTopTab('Clients')

            // If clientId is provided, attempt to open ClientDetails
            if (clientId && viewType === 'meeting') {
              const loadClientAndNavigate = async () => {
                try {
                  console.log('🔄 Loading client data for clientId:', clientId)
                  const clientsResponse = await apiService.listClients()
                  console.log('📊 Clients loaded:', clientsResponse)

                  const clientsData = clientsResponse?.data ?? clientsResponse
                  const client = Array.isArray(clientsData) ? clientsData.find(c => c.client_id === clientId) : null

                  if (client) {
                    console.log('✅ Found client:', client.name)
                    setSelectedClientForDetails(client)
                    setShowClientDetails(true)
                    window.highlightMeetingId = meetingId
                    console.log('✅ EMAIL VERIFICATION COMPLETE! Will highlight meeting:', meetingId)
                  } else {
                    console.warn('⚠️ Client not found for clientId:', clientId, '— staying on Clients list')
                    window.highlightMeetingId = meetingId
                  }
                } catch (error) {
                  console.error('❌ Failed to load client data:', error)
                  window.highlightMeetingId = meetingId
                } finally {
                  setIsLoading(false)
                }
              }
              loadClientAndNavigate()
            } else {
              // No specific client/view provided; just show Clients
              setIsLoading(false)
            }
          }
        } catch (error) {
          console.error('❌ Failed to load meeting data:', error)
          setIsLoading(false) // Turn off loading even on error
          
          // Still try to show the Clients tab so user can see other meetings
          setActiveTopTab('Clients')
        }
      }
      
      // Load meeting data directly (client selection logic is now handled above)
      loadMeetingData()
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (verified === 'true' && analysisStatus === 'processing') {
      // Analysis still processing
      console.log('Email verified! Analysis still processing...')
      // Show a message that analysis is still processing
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    } else if (error) {
      console.error('Verification error:', decodeURIComponent(error))
      // You could show an error message to the user here
      
      // Clean up URL parameters
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  useEffect(() => {
    if (selectedMenu === 'MindMap' && mindMap && mindMapRef.current) {
      console.log('Rendering mind map:', mindMap.substring(0, 100) + '...')
      let processedMindMap = mindMap
        .replace(/```mermaid/, '')
        .replace(/```$/, '')
        .trim();
      console.log('Processed mind map:', processedMindMap.substring(0, 100) + '...')
      
      mindMapRef.current.textContent = processedMindMap;
      try {
        mermaid.init(undefined, mindMapRef.current);
        const svg = mindMapRef.current.querySelector('svg');
        if (svg) {
          svg.setAttribute('width', '100%');
          svg.setAttribute('height', '100%');
          svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
          // Dynamically scale SVG to fill parent
          const parent = mindMapRef.current;
          setTimeout(() => {
            const bbox = svg.getBBox();
            const parentRect = parent.getBoundingClientRect();
            const scaleY = parentRect.height / bbox.height;
            svg.style.transform = `scale(${scaleY})`;
            svg.style.transformOrigin = 'top left';
          }, 0);
          console.log('Mind map rendered successfully')
        } else {
          console.error('No SVG found after mermaid.init')
          setMindMapError('Failed to render mind map: No SVG generated')
        }
      } catch (e) {
        console.error('Mermaid render error:', e)
        setMindMapError(`Failed to render mind map: ${e.message}`)
      }
    }
  }, [mindMap, selectedMenu]);

  // Set hasAnalysis when summary is successfully generated
  useEffect(() => {
    if (summary && summary !== 'Error generating summary.') {
      console.log('useEffect: Setting hasAnalysis to true because summary exists')
      setHasAnalysis(true)
      // ✅ 移除無謂的 activeTopTab 覆寫，避免與使用者導航競態
      // 使用者明確的導航不應被自動邏輯覆寫
    }
  }, [summary])

  // Load dashboard data when user becomes authenticated
  useEffect(() => {
    console.log('🔄 useEffect [isAuthenticated] triggered:', { isAuthenticated, hasSummary: !!summary, loginInProgress: loginInProgressRef.current, oauthCallback: oauthCallbackRef.current })
    
    // ✅ 如果登入操作正在進行中，不執行 loadDashboardData（避免競態條件）
    if (loginInProgressRef.current) {
      console.log('⏭️ Skipping loadDashboardData: Login in progress')
      return
    }
    
    // ✅ 關鍵修復：如果 OAuth callback 正在處理，不執行 loadDashboardData（避免覆蓋 OAuth 登入狀態）
    if (oauthCallbackRef.current || isOAuthCallbackActive) {
      console.log('⏭️ Skipping loadDashboardData: OAuth callback in progress')
      return
    }
    
    if (isAuthenticated && !summary) {
      console.log('✅ Loading dashboard data for authenticated user...')
      // ✅ 關鍵修復：如果剛登入（loginInProgressRef 剛被清除），使用 skipSessionExpired=true
      // 但是由於我們已經在上面檢查了 loginInProgressRef，這裡應該不會執行
      loadDashboardData()
    } else {
      console.log('❌ Not loading dashboard data:', { isAuthenticated, hasSummary: !!summary })
    }
  }, [isAuthenticated])

  // Handle default routing: navigate to latest meeting if no URL parameters
  useEffect(() => {
    console.log('🔍 Default routing useEffect triggered')
    console.log('  - isAuthenticated:', isAuthenticated)
    console.log('  - activeTopTab:', activeTopTab)
    console.log('  - meetings count:', meetings?.length || 0)
    console.log('  - hasAnalysis:', hasAnalysis)
    console.log('  - userNavigationRef:', userNavigationRef.current)
    console.log('  - oauthCallbackRef:', oauthCallbackRef.current)

    // ✅ 保護機制：如果使用者已明確導航，不執行自動路由（優先檢查）
    if (userNavigationRef.current !== null) {
      console.log('⏭️ Skipping default routing: user has explicitly navigated to', userNavigationRef.current)
      return
    }

    // ✅ 保護機制：如果是 OAuth callback，不執行自動路由（讓 OAuth callback 處理導向）
    if (oauthCallbackRef.current) {
      console.log('⏭️ Skipping default routing: OAuth callback in progress')
      return
    }

    // ✅ 關鍵修復：如果分析正在進行或模態框打開，不執行自動路由（防止分析過程中跳回 Dashboard）
    // 增加額外檢查，確保即使 ref 更新有延遲也能正確阻止路由
    // ✅ 關鍵修復：也檢查 currentAnalysis 狀態，確保分析進行中時不會觸發路由
    const isAnalysisActive = analysisInProgressRef.current || 
                              showUploadModal || 
                              showProgressModal ||
                              (currentAnalysis && (currentAnalysis.status === 'processing' || currentAnalysis.status === 'completed'))
    
    if (isAnalysisActive) {
      console.log('⏭️ Skipping default routing: analysis in progress or modals open', {
        analysisInProgress: analysisInProgressRef.current,
        showUploadModal,
        showProgressModal,
        currentAnalysisStatus: currentAnalysis?.status
      })
      return
    }

    // Only proceed if user is authenticated and dashboard data is loaded
    if (!isAuthenticated || !meetings || meetings.length === 0) {
      console.log('⏭️ Skipping default routing: not authenticated or no meetings')
      return
    }

    // Check for URL parameters to see if user already has a specific destination
    const urlParams = new URLSearchParams(window.location.search)
    const hasClientId = urlParams.get('clientId')
    const hasMeetingId = urlParams.get('meetingId')
    const hasViewParam = urlParams.get('view')

    // If URL already has parameters, don't auto-navigate (respect explicit navigation)
    if (hasClientId || hasMeetingId || hasViewParam) {
      console.log('⏭️ Skipping default routing: URL parameters detected')
      return
    }

    // If we're already on the Analysis tab or have analysis displayed, don't navigate
    if (activeTopTab === 'Analysis' || activeTopTab === 'Clients' || activeTopTab === 'Reels') {
      console.log('⏭️ Skipping default routing: already on a specific tab')
      return
    }

    // Auto-navigate to latest meeting (activeTopTab === null means we're on Dashboard)
    // Only execute if we haven't already routed and conditions are met
    if (activeTopTab === null && !hasAnalysis && !hasDefaultRoutedRef.current) {
      console.log('🚀 Default routing: attempting to navigate to latest meeting')
      const latestMeeting = getLatestMeeting(meetings)

      if (latestMeeting) {
        console.log('📊 Found latest meeting:', latestMeeting.id)
        hasDefaultRoutedRef.current = true // Set flag before calling
        loadLatestMeeting(latestMeeting.id)
      } else {
        console.log('⚠️ No valid latest meeting found')
        hasDefaultRoutedRef.current = true // Set flag even if no meeting found
        // Keep showing empty state (AnalyticsDashboard)
      }
    }
  }, [isAuthenticated, meetings, activeTopTab, hasAnalysis, showUploadModal, showProgressModal, currentAnalysis]) // ✅ 添加模態框狀態和 currentAnalysis 到依賴項，確保狀態變化時重新評估

  const downloadSummary = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: summary,
                size: 24,
              }),
            ],
          }),
        ],
      }],
    })

    const blob = await Packer.toBlob(doc)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'summary.docx'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const downloadMindMap = async () => {
    if (mindMapRef.current) {
      const canvas = await html2canvas(mindMapRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.querySelector('.mermaid');
          if (clonedElement) {
            clonedElement.style.width = mindMapRef.current.offsetWidth + 'px';
            clonedElement.style.height = mindMapRef.current.offsetHeight + 'px';
          }
        }
      });
      
      const image = canvas.toDataURL('image/jpeg', 1.0);
      const link = document.createElement('a');
      link.download = 'mindmap.jpg';
      link.href = image;
      link.click();
    }
  }

  const extractTextFromDoc = async (arrayBuffer) => {
    try {
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value
    } catch (error) {
      console.error('Error parsing DOC:', error)
      return 'Error extracting text from DOC'
    }
  }

  const handleTranscriptFileUpload = async (event) => {
    const file = event.target.files[0]
    setSummary('')
    if (file && (file.type === 'application/msword' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document')) {
      setSelectedFile(file)
      setIsLoading(true)
      try {
        const arrayBuffer = await file.arrayBuffer()
        const textContent = await extractTextFromDoc(arrayBuffer)
        console.log('File name:', file.name)
        console.log('File type:', file.type)
        console.log('File size:', file.size, 'bytes')
        console.log('Extracted text:', textContent)
        setFileContent(textContent)
      } catch (error) {
        console.error('Error processing file:', error)
        setFileContent('Error processing file')
      } finally {
        setIsLoading(false)
      }
    } else {
      alert('Please upload a DOC or DOCX file')
    }
  }

  const handleRecordingUpload = async (event) => {
    const file = event.target.files[0]
    setSummary('')
    setTranscriptionError('')
    
    if (file && file.type === 'video/mp4') {
      setSelectedFile(file)
      setIsTranscribing(true)
      
      try {
        const result = await apiService.convertMp4ToTranscript(file)
        console.log('Transcription successful:', result.transcript)
        setFileContent(result.transcript)
      } catch (error) {
        console.error('Error uploading recording:', error)
        setTranscriptionError('Error uploading recording: ' + error.message)
        setFileContent('')
      } finally {
        setIsTranscribing(false)
      }
    } else {
      alert('Please upload an MP4 file')
    }
  }

  const summarizeTextWithEmail = async (text, email) => {
    setUserEmail(email)
    setShowAnalysisProgress(true)
    
    try {
      console.log('About to call startAnalysisWithEmail with:', { email, text: text.substring(0, 100) + '...', fileName: selectedFile.name })
      console.log('apiService object:', apiService)
      console.log('startAnalysisWithEmail method:', typeof apiService.startAnalysisWithEmail)
      
      // Use the new email authentication endpoint
      const result = await apiService.startAnalysisWithEmail(
        email, 
        text, 
        selectedFile.name
      )
      
      console.log('Analysis started with email:', result)
      
      // The analysis will happen in the background
      // User will receive email when complete
      
    } catch (error) {
      console.error('Error starting analysis with email:', error)
      setShowAnalysisProgress(false)
      alert('Failed to start analysis: ' + error.message)
    }
  }

  const summarizeText = async (text) => {
    setIsSummarizing(true)
    setSummary('')
    setMindMap('')
    setMindMapGenerated(false)
    setCoachingAdvice('')
    setSalesTechniqueAdvice('')
    setClientActionItems('')
    setCoachActionItems('')
    setClientProfession('')
    setClientCompany('')
    setTargetAudience('')
    setPainPoint('')
    setGoal('')
    setCoachSuggestion('')
    setResourcesList([])
    setResourcesGenerated(false)
    setResourcesError('')
    try {
      console.log('Calling summarizeText API...')
      const result = await apiService.summarizeText(text)
      console.log('API response received:', result)
      
      const data = result.data
      
      // Set meeting type
      setIsDiscovery(result.isDiscovery)
      
      // Set all the extracted fields
      setClientName(data.clientName || '')
      setMeetingTitle(data.meetingTitle || '')
      setClientProfession(data.clientProfession || '')
      setClientCompany(data.clientCompany || '')
      setTargetAudience(data.targetAudience || '')
      setPainPoint(data.painPoint || '')
      setGoal(data.goal || '')
      setCoachSuggestion(data.coachSuggestions ? data.coachSuggestions.join('\n') : '')
      setSummary(data.summary || '')
      setCoachingAdvice(data.coachingAdvice ? data.coachingAdvice.join('\n') : '')
      setSalesTechniqueAdvice(data.salesTechniqueAdvice ? data.salesTechniqueAdvice.join('\n') : '')
      setClientActionItems(data.actionItemsClient ? data.actionItemsClient.join('\n') : '')
      setCoachActionItems(data.actionItemsCoach ? data.actionItemsCoach.join('\n') : '')
      
            // Handle follow-up email from response
      if (result.followUpEmail) {
        const emailContent = `Subject: ${result.followUpEmail.subject}\n\n${result.followUpEmail.body}`
        setFollowUpEmail(emailContent)
        setFollowUpEmailGenerated(true)
      }
      
      // Handle reels scripts from response
      if (result.socialMediaContent && result.socialMediaContent.reels) {
        setReelsScripts(result.socialMediaContent.reels)
        setReelsScriptsGenerated(true)
      }

      // Handle next meeting prep from response (generated with summarize-text)
      if (result.nextMeetingPrep) {
        setNextMeetingPrep(result.nextMeetingPrep)
      }
      
      console.log('All state variables set. Summary:', data.summary ? 'has content' : 'empty')
      // setHasAnalysis(true) - now handled by useEffect
      console.log('Summary set, useEffect will handle hasAnalysis')
      console.log('Navigation should happen automatically now')
      
      // Generate resources list after summary is created using the prompt from the response
      if (result.resourcesListPrompt) {
        console.log('Found resourcesListPrompt:', result.resourcesListPrompt)
        await generateResourcesList(result.resourcesListPrompt)
      } else {
        console.log('No resourcesListPrompt found in response')
      }
    } catch (error) {
      setSummary('Error generating summary.')
      console.error('Error in summarizeText:', error)
      // setHasAnalysis(false) - will be handled by useEffect
    } finally {
      setIsSummarizing(false)
      console.log('summarizeText completed, isSummarizing set to false')
      
      // Fallback: Ensure navigation happens even if useEffect fails
      if (summary && summary !== 'Error generating summary.') {
        console.log('Fallback: Setting hasAnalysis and activeTopTab')
        setHasAnalysis(true)
        setActiveTopTab(null)
      }
    }
  }

  // -------- Authentication handlers --------
  
  const handleSessionExpired = () => {
    console.log('🔐 Session expired, clearing authentication state')
    apiService.clearSessionToken()
    
    // Clear any user-specific data
    setMeetings([])
    setClients([])
    setReels([])
    setTags([])
    
    // Show login prompt instead of alert
    handleSessionExpiredLogin()
    
    // Clear the current view
    setActiveTopTab(null)
  }

  // Listen for session expiration events
  useEffect(() => {
    const handleSessionExpiredEvent = () => {
      handleSessionExpired()
    }
    
    window.addEventListener('sessionExpired', handleSessionExpiredEvent)
    
    return () => {
      window.removeEventListener('sessionExpired', handleSessionExpiredEvent)
    }
  }, [])

  // -------- Top Nav data loaders and actions --------
  
  const loadMeetings = async () => {
    console.log('🔍 loadMeetings called')
    setIsLoadingMeetings(true)
    try {
      // Check if user is authenticated
      if (!apiService.isAuthenticated()) {
        console.warn('⚠️ No session token available for meetings')
        setMeetings([])
        return
      }
      
      console.log('🔍 Making API call to listMeetings...')
      const data = await apiService.listMeetings()
      console.log('🔍 listMeetings response:', data)
      setMeetings(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('❌ Failed to load meetings', e)
      // ✅ 如果登入操作正在進行中，不觸發 session expired（避免誤判）
      if (!loginInProgressRef.current && e.message.includes('Session expired')) {
        // Handle session expiration
        handleSessionExpired()
      } else if (loginInProgressRef.current) {
        console.log('⚠️ Meetings load failed during login, skipping session expired handling')
      }
      setMeetings([])
    } finally {
      setIsLoadingMeetings(false)
    }
  }


  // Helper function to get the latest meeting from the meetings array
  const getLatestMeeting = (meetingsArray) => {
    if (!meetingsArray || meetingsArray.length === 0) return null
    
    // Sort by created_at or meeting_date in descending order (newest first)
    return meetingsArray.sort((a, b) => {
      const dateA = new Date(a.created_at || a.meeting_date || 0)
      const dateB = new Date(b.created_at || b.meeting_date || 0)
      return dateB - dateA // Descending order: newest first
    })[0]
  }

  // Load the latest meeting data and populate state (for default routing)
  const loadLatestMeeting = async (targetMeetingId) => {
    // ✅ 關鍵修復：如果分析正在進行，不執行 loadLatestMeeting（防止組件卸載）
    // ✅ 關鍵修復：也檢查 currentAnalysis 狀態，確保分析進行中時不會觸發路由
    const isAnalysisActive = analysisInProgressRef.current || 
                              showUploadModal || 
                              showProgressModal ||
                              (currentAnalysis && (currentAnalysis.status === 'processing' || currentAnalysis.status === 'completed'))
    
    if (isAnalysisActive) {
      console.log('⏭️ Skipping loadLatestMeeting: analysis in progress or modals open', {
        analysisInProgress: analysisInProgressRef.current,
        showUploadModal,
        showProgressModal,
        currentAnalysisStatus: currentAnalysis?.status
      })
      return
    }
    
    // Early return if already loading/loaded this meeting
    if (!targetMeetingId) {
      console.warn('⚠️ Skipping loadLatestMeeting: no targetMeetingId provided')
      return
    }
    if (meetingId && targetMeetingId === meetingId) {
      console.log('⏭️ Skipping loadLatestMeeting: already loaded meeting', targetMeetingId)
      return
    }
    try {
      console.log('📥 loadLatestMeeting called for meetingId:', targetMeetingId)
      const response = await apiService.getMeetingById(targetMeetingId)
      const data = response?.data ?? response

      if (data) {
        console.log('✅ Latest meeting data loaded')

        // Populate all the state with meeting data (same as email verification flow)
        setSummary(data.summary?.summary || '')
        setClientName(data.summary?.clientName || '')
        setMeetingTitle(data.summary?.meetingTitle || '')
        setPainPoint(data.summary?.painPoint || '')
        setGoal(data.summary?.goal || '')
        setClientProfession(data.summary?.clientProfession || '')
        setClientCompany(data.summary?.clientCompany || '')
        setTargetAudience(data.summary?.targetAudience || '')
        setCoachSuggestion(data.summary?.coachSuggestions?.join(', ') || '')
        setSalesTechniqueAdvice(data.summary?.salesTechniqueAdvice?.join(', ') || '')
        setCoachingAdvice(data.summary?.coachingAdvice?.join(', ') || '')
        setClientActionItems(data.summary?.actionItemsClient?.join(', ') || '')
        setCoachActionItems(data.summary?.actionItemsCoach?.join(', ') || '')
        setFollowUpEmail(data.followUpEmail?.content || '')
        setReelsScripts(data.socialMediaContent?.reels || [])
        setMindMap(data.mindMap || '')
        setNextMeetingPrep(data.nextMeetingPrep)
        setIsDiscovery(data.isDiscovery)
        setMeetingId(targetMeetingId)

        // Load existing resources list if available
        if (data.resourcesList && Array.isArray(data.resourcesList) && data.resourcesList.length > 0) {
          setResourcesList(data.resourcesList)
          setResourcesGenerated(true)
          console.log('📚 Loaded existing resources list:', data.resourcesList.length, 'items')
        }

        // Mark analysis ready and switch to Analysis tab (or Clients if viewing clients)
        setHasAnalysis(true)
        setActiveTopTab('Clients')

        console.log('✅ Latest meeting fully loaded and state updated')
      } else {
        console.error('❌ Latest meeting data is empty')
      }
    } catch (error) {
      console.error('❌ Failed to load latest meeting:', error)
      // Stay on Dashboard if loading fails
    }
  }

  // ✅ 處理導航到分析頁面的回調函數
  const handleNavigateToAnalysis = (meetingId) => {
    if (!meetingId) {
      console.warn('⚠️ handleNavigateToAnalysis: no meetingId provided')
      return
    }
    console.log('🔍 handleNavigateToAnalysis called with meetingId:', meetingId)
    // 使用現有的 loadLatestMeeting 函數來載入會議數據並導航
    loadLatestMeeting(meetingId)
  }

  const loadClients = async () => {
    console.log('🔍 loadClients called')
    setIsLoadingClients(true)
    try {
      // Check if user is authenticated
      if (!apiService.isAuthenticated()) {
        console.warn('⚠️ No session token available for clients')
        setClients([])
        return
      }
      
      console.log('🔍 Making API call to listClients...')
      const data = await apiService.listClients()
      console.log('🔍 listClients response:', data)
      
      // Handle the new API response structure: { success: true, data: [...] }
      let clientsData = []
      if (data && data.success && Array.isArray(data.data)) {
        clientsData = data.data
      } else if (Array.isArray(data)) {
        // Fallback for old API structure
        clientsData = data
      } else {
        console.warn('Unexpected clients API response structure:', data)
        clientsData = []
      }
      
      console.log(`🔍 Raw clients data from API: ${clientsData.length} clients`)
      
      if (clientsData.length > 0) {
        // The backend now returns clients with tags included
        // We need to ensure each tag has an 'id' field for the frontend
        const clientsWithTags = clientsData.map(client => ({
          ...client,
          tags: Array.isArray(client.tags) 
            ? client.tags.map(tag => ({
                ...tag,
                id: tag.id || `${tag.name}-${Date.now()}` // Ensure each tag has an id
              }))
            : []
        }))
        
        // ✅ 修復問題 2：對 clients 陣列進行去重處理，使用 client_id 作為唯一標識
        // 雙重保護：即使後端返回重複數據，前端也會去重
        const uniqueClientsMap = new Map()
        clientsWithTags.forEach((client, index) => {
          const clientId = client.client_id
          if (!clientId) {
            console.warn(`⚠️ Client at index ${index} has no client_id:`, client)
            return
          }
          
          if (!uniqueClientsMap.has(clientId)) {
            uniqueClientsMap.set(clientId, client)
          } else {
            // 如果已存在，合併標籤（避免重複標籤）
            const existingClient = uniqueClientsMap.get(clientId)
            const existingTagNames = new Set(existingClient.tags.map(t => t.name))
            const newTags = client.tags.filter(t => !existingTagNames.has(t.name))
            existingClient.tags = [...existingClient.tags, ...newTags]
            console.warn(`⚠️ Duplicate client_id detected: ${clientId} (${client.name}), merged tags`)
          }
        })
        const uniqueClients = Array.from(uniqueClientsMap.values())
        
        // 驗證去重結果
        const clientIds = uniqueClients.map(c => c.client_id)
        const duplicateIds = clientIds.filter((id, index) => clientIds.indexOf(id) !== index)
        if (duplicateIds.length > 0) {
          console.error(`❌ Still have duplicate client_ids after deduplication:`, duplicateIds)
        }
        
        // 驗證去重結果並輸出詳細日誌
        const beforeCount = clientsWithTags.length
        const afterCount = uniqueClients.length
        console.log(`✅ Deduplicated: ${beforeCount} -> ${afterCount} clients`)
        console.log('Processed clients with tags (after deduplication):', uniqueClients.map(c => ({ id: c.client_id, name: c.name })))
        
        if (beforeCount !== afterCount) {
          console.log(`⚠️ Removed ${beforeCount - afterCount} duplicate clients`)
        } else {
          console.log(`✅ No duplicates found, all ${afterCount} clients are unique`)
        }
        
        // 最終驗證：確保沒有重複的 client_id
        const finalClientIds = uniqueClients.map(c => c.client_id)
        const finalDuplicateIds = finalClientIds.filter((id, index) => finalClientIds.indexOf(id) !== index)
        if (finalDuplicateIds.length > 0) {
          console.error(`❌ CRITICAL: Still have duplicate client_ids after deduplication:`, finalDuplicateIds)
          // 強制去重：只保留每個 client_id 的第一個
          const forcedUniqueClients = []
          const seenIds = new Set()
          uniqueClients.forEach(client => {
            if (!seenIds.has(client.client_id)) {
              seenIds.add(client.client_id)
              forcedUniqueClients.push(client)
            }
          })
          console.log(`🔧 Force deduplication: ${uniqueClients.length} -> ${forcedUniqueClients.length} clients`)
          setClients(forcedUniqueClients)
        } else {
          setClients(uniqueClients)
        }
      } else {
        setClients([])
      }
    } catch (e) {
      console.error('Failed to load clients', e)
      // ✅ 如果登入操作正在進行中，不觸發 session expired（避免誤判）
      if (!loginInProgressRef.current && e.message.includes('Session expired')) {
        // Handle session expiration
        handleSessionExpired()
        setClients([])
        return
      } else if (loginInProgressRef.current) {
        console.log('⚠️ Clients load failed during login, skipping session expired handling')
        setClients([])
        return
      }
      // Fallback to sample data if backend is not available
      console.log('Using fallback sample clients')
      setClients([
        { 
          client_id: '1', 
          name: 'John Smith', 
          email: 'john@example.com', 
          meeting_count: 3,
          tags: [
            { id: '1', name: 'VIP Client', color: '#FF6B6B' },
            { id: '3', name: 'Active', color: '#45B7D1' }
          ]
        },
        { 
          client_id: '2', 
          name: 'Sarah Johnson', 
          email: 'sarah@example.com', 
          meeting_count: 1,
          tags: [
            { id: '2', name: 'Prospect', color: '#4ECDC4' }
          ]
        },
        { 
          client_id: '3', 
          name: 'Mike Wilson', 
          email: 'mike@example.com', 
          meeting_count: 5,
          tags: [
            { id: '3', name: 'Active', color: '#45B7D1' },
            { id: '4', name: 'Follow Up', color: '#96CEB4' }
          ]
        }
      ])
    } finally {
      setIsLoadingClients(false)
    }
  }

  const loadReels = async () => {
    setIsLoadingReels(true)
    try {
      // Check if user is authenticated
      if (!apiService.isAuthenticated()) {
        console.warn('⚠️ No session token available for reels')
        setReels([])
        return
      }
      
      const data = await apiService.listReels()
      setReels(Array.isArray(data) ? data : [])
    } catch (e) {
      console.error('Failed to load reels', e)
      // ✅ 如果登入操作正在進行中，不觸發 session expired（避免誤判）
      if (!loginInProgressRef.current && e.message.includes('Session expired')) {
        // Handle session expiration
        handleSessionExpired()
      } else if (loginInProgressRef.current) {
        console.log('⚠️ Reels load failed during login, skipping session expired handling')
      }
      setReels([])
    } finally {
      setIsLoadingReels(false)
    }
  }

  // Tag management functions
  const loadTags = async () => {
    setIsLoadingTags(true)
    setTagsError(null)
    try {
      // Check if user is authenticated
      if (!apiService.isAuthenticated()) {
        console.warn('⚠️ No session token available for tags')
        setTags([])
        return
      }
      
      console.log('Loading tags for authenticated user')
      const data = await apiService.listTags()
      console.log('Tags API response:', data)
      
      // Handle the new API response structure: { success: true, tags: [...] }
      if (data && data.success && Array.isArray(data.tags)) {
        setTags(data.tags)
      } else if (Array.isArray(data)) {
        // Fallback for old API structure
        setTags(data)
      } else {
        console.warn('Unexpected tags API response structure:', data)
        setTags([])
      }
    } catch (e) {
      console.error('Failed to load tags', e)
      if (e.message.includes('Session expired')) {
        // Handle session expiration
        handleSessionExpired()
        setTags([])
        return
      }
      setTagsError('Failed to load tags')
      // Fallback to sample data if backend is not available
      console.log('Using fallback sample tags')
      setTags([
        { id: '1', name: 'VIP Client', color: '#FF6B6B' },
        { id: '2', name: 'Prospect', color: '#4ECDC4' },
        { id: '3', name: 'Active', color: '#45B7D1' },
        { id: '4', name: 'Follow Up', color: '#96CEB4' }
      ])
    } finally {
      setIsLoadingTags(false)
    }
  }

  const createTag = async (tagData) => {
    try {
      const result = await apiService.createTag(tagData)
      // Reload tags to get the updated list
      await loadTags()
      return result
    } catch (e) {
      console.error('Failed to create tag', e)
      if (e.message.includes('Session expired')) {
        handleSessionExpired()
        return
      }
      // Fallback: create tag locally if backend is not available
      console.log('Using fallback tag creation')
      const newTag = {
        id: Date.now().toString(),
        name: tagData.name,
        color: tagData.color
      }
      setTags(prevTags => [...prevTags, newTag])
      return newTag
    }
  }

  const updateTag = async (tagId, updates) => {
    try {
      await apiService.updateTag(tagId, updates)
      // Reload tags to get the updated list
      await loadTags()
    } catch (e) {
      console.error('Failed to update tag', e)
      throw e
    }
  }

  const deleteTag = async (tagId) => {
    try {
      await apiService.deleteTag(tagId)
      // Reload tags to get the updated list
      await loadTags()
    } catch (e) {
      console.error('Failed to delete tag', e)
      throw e
    }
  }

  const assignTagToClient = async (clientId, tagId) => {
    try {
      console.log('Assigning tag', tagId, 'to client', clientId)
      await apiService.assignTagToClient(clientId, tagId)
      console.log('Tag assigned successfully, reloading clients')
      // Reload clients to get updated tag assignments
      await loadClients()
    } catch (e) {
      console.error('Failed to assign tag to client', e)
      // Fallback: update client tags locally if backend is not available
      console.log('Using fallback tag assignment')
      setClients(prevClients => 
        prevClients.map(client => {
          if (client.client_id === clientId) {
            const tagToAdd = tags.find(tag => tag.id === tagId)
            if (tagToAdd && !client.tags?.some(t => t.id === tagId)) {
              return {
                ...client,
                tags: [...(client.tags || []), tagToAdd]
              }
            }
          }
          return client
        })
      )
    }
  }

  const removeTagFromClient = async (clientId, tagId) => {
    try {
      await apiService.removeTagFromClient(clientId, tagId)
      // Reload clients to get updated tag assignments
      await loadClients()
    } catch (e) {
      console.error('Failed to remove tag from client', e)
      // Fallback: update client tags locally if backend is not available
      console.log('Using fallback tag removal')
      setClients(prevClients => 
        prevClients.map(client => {
          if (client.client_id === clientId) {
            return {
              ...client,
              tags: (client.tags || []).filter(tag => tag.id !== tagId)
            }
          }
          return client
        })
      )
    }
  }

  const handleTopTabChange = async (tabKey) => {
    console.log('🔄 Tab changed to:', tabKey)
    // ✅ 優先設定保護標記，確保在任何狀態更新前就生效
    userNavigationRef.current = tabKey
    // ✅ 立即設定 activeTopTab，確保 UI 立即響應
    setActiveTopTab(tabKey)
    
    if (tabKey === 'Clients') {
      console.log('📊 Loading Clients tab data...')
      // ✅ 載入資料（這可能會觸發其他 useEffect，但 userNavigationRef 已保護）
      await Promise.all([
        loadClients(),
        loadMeetings(), // Need meetings for the tree view
        loadTags() // Load tags when accessing Clients tab
      ])
      console.log('✅ Clients tab data loaded')
      // ✅ 確保 activeTopTab 在資料載入後仍然是 'Clients'（防止被覆寫）
      if (userNavigationRef.current === 'Clients') {
        setActiveTopTab('Clients')
      }
    }
    if (tabKey === 'Reels') {
      console.log('🎬 Loading Reels data...')
      await loadReels()
    }
    if (tabKey === null) {
      console.log('🏠 Loading Dashboard data...')
      // Dashboard tab - ensure all data is loaded
      await loadDashboardData()
    }
  }

  // Client detail view handlers
  const handleClientClick = async (client) => {
    console.log('👁️ Client row clicked:', client.name)

    // Ensure we're on Clients tab
    setActiveTopTab('Clients')

    // Show client details view (not meeting detail view)
    console.log('ℹ️ Opening client details view for:', client.name)
    setSelectedClientForDetails(client)
    setShowClientDetails(true)
    setSelectedClient(client)
    setSelectedMeeting(null)
    
    // Clear meeting detail view state
    setClientViewMode(null)
  }

  const handleToggleFavoriteClient = async (clientId, isFavorite) => {
    try {
      console.log('⭐ Toggling client favorite:', clientId, isFavorite)
      // TODO: Implement API call to toggle client favorite status
      // await apiService.toggleClientFavorite(clientId, isFavorite)
      // await loadClients() // Reload clients to get updated favorite status
      console.log('Client favorite toggled successfully')
    } catch (error) {
      console.error('Error toggling client favorite:', error)
    }
  }

  const handleEditClient = async (clientArg, updatePayload) => {
    try {
      // ✅ 行內編輯儲存：直接套用更新至現有 clients 狀態，確保 UI 立即反映
      if (typeof clientArg === 'string' && updatePayload) {
        const clientId = clientArg
        setClients(prevClients => prevClients.map(client => {
          if (client.client_id !== clientId) return client

          const nextClient = { ...client }
          if (updatePayload.name !== undefined) nextClient.name = updatePayload.name
          if (updatePayload.email !== undefined) nextClient.email = updatePayload.email
          if (updatePayload.notes !== undefined) nextClient.notes = updatePayload.notes
          if (updatePayload.status !== undefined) nextClient.status = updatePayload.status
          if (Array.isArray(updatePayload.tags)) {
            nextClient.tags = updatePayload.tags.map(tag => {
              if (typeof tag === 'string') {
                return tag
              }
              return tag?.name || ''
            })
          }
          return nextClient
        }))

        // 後台資料仍以 loadClients 保持同步（非同步，失敗時僅記錄）
        loadClients().catch(err => {
          console.warn('Failed to refresh clients after inline update:', err)
        })
        return
      }

      // 向後相容：若傳入的其實是 client 物件（例如「Open」行為）
      if (clientArg && typeof clientArg === 'object') {
        const client = clientArg
        console.log('👁️ Opening client details:', client.name)
        setSelectedClientForDetails(client)
        setShowClientDetails(true)
        setActiveTopTab('Clients')
      }
    } catch (error) {
      console.error('Error handling client edit:', error)
    }
  }

  const handleCloseClientDetails = async () => {
    setShowClientDetails(false)
    setSelectedClientForDetails(null)
    setClientMeetings([]) // Clear meetings
    setClientViewMode('all-clients') // ✅ 重置視圖模式：允許 ClientsTable 顯示
    setActiveTopTab('Clients') // Return to clients tab
    // ✅ 觸發資料載入（會執行 loadClients, loadMeetings, loadTags）
    await handleTopTabChange('Clients')
  }

  const handleMeetingsLoaded = (meetings) => {
    setClientMeetings(meetings)
  }

  const handleScrollToMeeting = (meetingId) => {
    const element = document.getElementById(`meeting-${meetingId}`)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  const handleDeleteClient = async (client) => {
    try {
      if (window.confirm(`Are you sure you want to archive client "${client.name}"? They will be moved to archived status and hidden from the active view.`)) {
        console.log('📦 Archiving client:', client.name)
        
        // Update client status to 'Archived'
        // makeAbsoluteRequest will throw an error if the API returns success: false
        // If successful, it returns the data (updated client)
        const updatedClient = await apiService.updateClient(client.client_id, {
          status: 'Archived'
        })
        
        // If we reach here, the API call was successful
        console.log('✅ Client archived successfully:', updatedClient)
        
        // Optimistically update the client in the list
        setClients(prevClients => prevClients.map(c => {
          if (c.client_id === client.client_id) {
            return { ...c, status: 'Archived' }
          }
          return c
        }))
        
        // Reload clients list to ensure consistency
        await loadClients()
      }
    } catch (error) {
      console.error('Error archiving client:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Failed to archive client:', errorMessage)
      alert(`Failed to archive client: ${errorMessage}. Please try again.`)
    }
  }

  const handleMeetingClick = async (client, meeting) => {
    console.log('📋 Meeting clicked:', meeting.meeting_title, 'for client:', client.name)

    // Close ClientDetails view first
    setShowClientDetails(false)
    setSelectedClientForDetails(null)

    // Set up for MeetingDetailView
    setSelectedClient(client)
    setClientViewMode('single-client')

    // Load all meetings for this client to display in TopNav
    try {
      const clientDetail = await apiService.getClientById(client.client_id)
      if (clientDetail?.meetings) {
        setClientMeetings(clientDetail.meetings)
      }
    } catch (error) {
      console.error('Failed to load client meetings for TopNav:', error)
    }

    // Fetch full meeting details
    try {
      console.log('🔄 Loading full meeting details for:', meeting.meeting_id)
      const fullMeetingData = await apiService.getMeetingById(meeting.meeting_id)
      console.log('✅ Full meeting data loaded:', fullMeetingData)
      setSelectedMeeting(fullMeetingData)
    } catch (error) {
      console.error('❌ Failed to load meeting details:', error)
      // Fallback to basic meeting data
      setSelectedMeeting(meeting)
    }
  }

  const handleBackToAllClients = () => {
    console.log('🔙 Back to all clients')
    setSelectedClient(null)
    setSelectedMeeting(null)
    setClientViewMode('all-clients')
  }

  const handleToggleFavoriteReel = async (id, isFavorite) => {
    setReels(prev => prev.map(r => r.id === id ? { ...r, is_favorite: isFavorite ? 1 : 0 } : r))
    try {
      await apiService.favoriteReel(id, isFavorite)
    } catch (e) {
      console.error('Favorite reel failed, reverting', e)
      setReels(prev => prev.map(r => r.id === id ? { ...r, is_favorite: !isFavorite ? 1 : 0 } : r))
    }
  }

  const handleEditReel = async (updatedReel) => {
    try {
      await apiService.updateReel(updatedReel)
      await loadReels() // Reload to get updated data
    } catch (error) {
      console.error('Error updating reel:', error)
      alert('Failed to update reel: ' + (error.message || 'Unknown error'))
    }
  }

  const handleDeleteReel = async (reel) => {
    const ok = window.confirm('Delete this reel?')
    if (!ok) return
    try {
      await apiService.deleteReel(reel.id)
      setReels(prev => prev.filter(r => r.id !== reel.id))
    } catch (e) {
      console.error('Delete reel failed', e)
      alert('Failed to delete reel')
    }
  }

  // Generate mind map only when user clicks the button
  const generateMindMap = async () => {
    setIsGeneratingMindMap(true)
    setMindMapError('')
    try {
      console.log('Generating mind map with summary:', summary.substring(0, 100) + '...')
      const data = await apiService.generateMindMap(summary, isDiscovery)
      console.log('Mind map API response:', data)
      
      if (data && data.mermaidCode) {
        console.log('Setting mind map with mermaid code:', data.mermaidCode.substring(0, 100) + '...')
        
        // Clean and validate the Mermaid code
        let cleanedMermaidCode = data.mermaidCode
          .replace(/```mermaid/g, '')
          .replace(/```$/g, '')
          .trim()
        
        // Ensure it starts with 'mindmap'
        if (!cleanedMermaidCode.startsWith('mindmap')) {
          cleanedMermaidCode = 'mindmap\n' + cleanedMermaidCode
        }
        
        console.log('Cleaned mermaid code:', cleanedMermaidCode.substring(0, 100) + '...')
        setMindMap(cleanedMermaidCode)
        setShowMindMapButton(false)
        setMindMapGenerated(true)
      } else {
        console.error('No mermaidCode in response:', data)
        setMindMapError('No mind map data received from server')
      }
    } catch (error) {
      console.error('Error generating mind map:', error)
      setMindMapError(`Error generating mind map: ${error.message}`)
    } finally {
      setIsGeneratingMindMap(false)
    }
  }

  const generateNextMeetingPrep = async () => {
    setIsGeneratingNextMeetingPrep(true)
    try {
      // For demo purposes, using placeholder values
      // In a real app, these would come from user authentication and client selection
      const userId = 'test-user-123'
      const clientId = 'ea41ff22-58c5-4ced-b8df-a0709d60eae1'
      
      console.log('Generating next meeting preparation...')
      const data = await apiService.generateNextMeetingPrep(userId, clientId)
      console.log('Next meeting prep API response:', data)
      
      setNextMeetingPrep(data)
    } catch (error) {
      console.error('Error generating next meeting preparation:', error)
      setNextMeetingPrep({ error: `Error generating next meeting preparation: ${error.message}` })
    } finally {
      setIsGeneratingNextMeetingPrep(false)
    }
  }





  const downloadFollowUpEmail = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: followUpEmail,
                size: 24,
              }),
            ],
          }),
        ],
      }],
    })
    const blob = await Packer.toBlob(doc)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'followup_email.docx'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const downloadClientActionItems = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: clientActionItems,
                size: 24,
              }),
            ],
          }),
        ],
      }],
    })
    const blob = await Packer.toBlob(doc)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'client_action_items.docx'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const downloadCoachActionItems = async () => {
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: coachActionItems,
                size: 24,
              }),
            ],
          }),
        ],
      }],
    })
    const blob = await Packer.toBlob(doc)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'coach_action_items.docx'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const downloadAll = async () => {
    const zip = new JSZip();
    // Summary
    if (summary) {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [new Paragraph({ children: [new TextRun({ text: summary, size: 24 })] })],
        }],
      });
      const blob = await Packer.toBlob(doc);
      zip.file('summary.docx', blob);
    }
    // Mind Map (as JPEG)
    if (mindMapRef.current) {
      const canvas = await html2canvas(mindMapRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });
      const dataUrl = canvas.toDataURL('image/jpeg', 1.0);
      const imgBlob = await (await fetch(dataUrl)).blob();
      zip.file('mindmap.jpg', imgBlob);
    }
    // Coaching Advice
    if (coachingAdvice) {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [new Paragraph({ children: [new TextRun({ text: coachingAdvice, size: 24 })] })],
        }],
      });
      const blob = await Packer.toBlob(doc);
      zip.file('coaching_advice.docx', blob);
    }
    // Client Action Items
    if (clientActionItems) {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [new Paragraph({ children: [new TextRun({ text: clientActionItems, size: 24 })] })],
        }],
      });
      const blob = await Packer.toBlob(doc);
      zip.file('client_action_items.docx', blob);
    }
    // Coach Action Items
    if (coachActionItems) {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [new Paragraph({ children: [new TextRun({ text: coachActionItems, size: 24 })] })],
        }],
      });
      const blob = await Packer.toBlob(doc);
      zip.file('coach_action_items.docx', blob);
    }
    // Follow-Up Email
    if (followUpEmail) {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [new Paragraph({ children: [new TextRun({ text: followUpEmail, size: 24 })] })],
        }],
      });
      const blob = await Packer.toBlob(doc);
      zip.file('followup_email.docx', blob);
    }
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    saveAs(zipBlob, 'session_outputs.zip');
  }

      // Back button handler
    const handleBack = () => {
      setUploadType(null)
      setSelectedFile(null)
    setFileContent('')
    setSummary('')
    setMindMap('')
    setCoachingAdvice('')
    setClientActionItems('')
    setCoachActionItems('')
    setFollowUpEmail('')
    setResourcesList([])
    setResourcesGenerated(false)
    setResourcesError('')
    setIsLoading(false)
    setIsSummarizing(false)
    setIsTranscribing(false)
    setTranscriptionError('')
    setShowAnalysisProgress(false)
    setUserEmail('')
    // setHasAnalysis(false) - will be handled by useEffect when summary is cleared
    setActiveTopTab(null)
  }



  const downloadReelsScripts = async () => {
    if (!Array.isArray(reelsScripts)) return
    
    const reelsText = reelsScripts.map((reel, index) => 
      `Reel Script ${index + 1}:\n` +
      `Hook: ${reel.hook}\n` +
      `Narrative: ${reel.narrative}\n` +
      `Call to Action: ${reel.callToAction}\n` +
      `Visuals: ${reel.visuals}\n` +
      `Audio: ${reel.audio}\n` +
      `Hashtags: ${reel.hashtags ? reel.hashtags.join(', ') : ''}\n`
    ).join('\n\n')
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: reelsText,
                size: 24,
              }),
            ],
          }),
        ],
      }],
    })
    const blob = await Packer.toBlob(doc)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'reels_scripts.docx'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  const generateResourcesList = async (prompt) => {
    setIsGeneratingResources(true)
    setResourcesError('')
    try {
      console.log('Generating resources list with prompt:', prompt.substring(0, 100) + '...')
      const result = await apiService.getResourcesList(prompt)
      console.log('Resources API response:', result)
      
      if (result && result.resourcesList) {
        console.log('Setting resources list:', result.resourcesList)
        setResourcesList(result.resourcesList)
        setResourcesGenerated(true)
        console.log('Resources generated successfully, count:', result.resourcesList.length)
      } else {
        console.error('No resourcesList in response:', result)
        setResourcesError('No resources data received from server')
      }
    } catch (error) {
      console.error('Error generating resources list:', error)
      setResourcesError(`Error generating resources list: ${error.message}`)
    } finally {
      setIsGeneratingResources(false)
    }
  }

  const generateResourcesListForMeeting = async () => {
    setIsGeneratingResources(true)
    setResourcesError('')
    try {
      // Use the stored meeting ID from state
      if (!meetingId) {
        throw new Error('Meeting ID not found. Please refresh the page and try again.')
      }
      
      // Get the existing meeting data to access the resourcesListPrompt
      const response = await apiService.getMeetingById(meetingId)
      if (!response.success || !response.data) {
        throw new Error('Failed to get meeting data')
      }
      
      // Check if resources list already exists
      if (response.data.resourcesList && Array.isArray(response.data.resourcesList) && response.data.resourcesList.length > 0) {
        console.log('Found existing resources list:', response.data.resourcesList.length, 'items')
        setResourcesList(response.data.resourcesList)
        setResourcesGenerated(true)
        return
      }
      
      // Use the existing resourcesListPrompt from the database
      const resourcesListPrompt = response.data.resourcesListPrompt
      if (!resourcesListPrompt || typeof resourcesListPrompt !== 'string') {
        throw new Error('No valid resources list prompt found. Please regenerate the analysis.')
      }
      
      console.log('Using existing resources list prompt:', resourcesListPrompt.substring(0, 100) + '...')
      
      const result = await apiService.generateResourcesList(resourcesListPrompt, meetingId)
      console.log('Resources API response:', result)
      
      if (result && result.resourcesList) {
        console.log('Setting resources list:', result.resourcesList)
        setResourcesList(result.resourcesList)
        setResourcesGenerated(true)
        console.log('Resources generated successfully, count:', result.resourcesList.length)
      } else {
        console.error('No resourcesList in response:', result)
        setResourcesError('No resources data received from server')
      }
    } catch (error) {
      console.error('Error generating resources list:', error)
      setResourcesError(`Error generating resources list: ${error.message}`)
    } finally {
      setIsGeneratingResources(false)
    }
  }

  const downloadResourcesList = async () => {
    if (!resourcesList || resourcesList.length === 0) {
      return
    }
    
    const resourcesText = resourcesList.map((resource, index) => {
      return `${index + 1}. ${resource.title}\n   Type: ${resource.type}\n   URL: ${resource.url}\n   Description: ${resource.description}\n\n`
    }).join('')
    
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: 'Resources List\n\n',
                size: 28,
                bold: true,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: resourcesText,
                size: 24,
              }),
            ],
          }),
        ],
      }],
    })
    const blob = await Packer.toBlob(doc)
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'resources_list.docx'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }



  // Helper for menu items
  const menuItems = [
    { key: 'Insights', label: 'Insights' },
    { key: 'Summary', label: 'Summary' },
    { key: 'ActionClient', label: 'Action Items for Client' },
    { key: 'ActionCoach', label: 'Action Items for Coach' },
    ...(isDiscovery ? [{ key: 'SalesTechniqueAdvice', label: 'Sales Technique Advice' }] : [{ key: 'CoachingAdvice', label: 'Coaching Advice' }]),
    { key: 'ResourcesList', label: 'Resources List' },
    { key: 'MindMap', label: mindMapGenerated ? 'Mind Map' : 'Generate Mind Map' },
    { key: 'FollowUpEmail', label: 'Follow-up Email Template' },
    { key: 'ReelsScripts', label: 'Reels Scripts' },
    { key: 'NextMeetingPrep', label: 'Preparation for Next Meeting' },
    ...(reelsScriptsGenerated ? [{ key: 'IGCreative', label: 'Generate IG Creative' }] : []),
  ]

  // Menu click handler
  const handleMenuClick = async (key) => {
    setSelectedMenu(key)
    if (key === 'ResourcesList' && !resourcesGenerated) {
      // If resources haven't been generated yet, we need to regenerate them
      // This would typically happen if the user manually clicks to generate resources
      console.log('Manual resources generation requested')
      // For now, we'll just show the empty state since resources should be auto-generated
    }
    if (key === 'MindMap' && !mindMapGenerated) {
      await generateMindMap()
      setMindMapGenerated(true)
    }

    // NextMeetingPrep is now included in summarize-text; no extra call here

  }

  // ✅ 檢測是否為後台登入端口（5174）
  const isBackendLoginPort = window.location.port === '5174'
  
  // Landing page removed - redirecting directly to dashboard
  // ✅ 關鍵修復：在 OAuth callback 期間，即使 isAuthenticated 還沒更新，也要顯示主應用程式
  // 使用 isOAuthCallbackActive || oauthCallbackRef.current 確保 OAuth callback 期間頁面正常顯示
  const shouldShowMainApp = (summary || (isAuthenticated && (!currentUser || currentUser.onboarding_completed !== false)) || isOAuthCallbackActive || oauthCallbackRef.current) && !showAnalysisProgress
  
  console.log('🔍 Rendering decision:', {
    showLoginPrompt,
    isBackendLoginPort,
    summary: !!summary,
    isOAuthCallbackActive,
    oauthCallbackRef: oauthCallbackRef.current,
    isAuthenticated,
    currentUser: !!currentUser,
    onboardingCompleted: currentUser?.onboarding_completed,
    shouldShowMainApp,
    activeTopTab
  })
  
  // Landing page removed - if not authenticated, show LoginPrompt instead
  // If authenticated, show Dashboard directly

  // Show Login Page if user clicked login
  // Removed old LoginPage - now using new LoginForm/RegisterForm in modal
  // if (showLoginPage && !isAuthenticated) {
  //   return (
  //     <LoginPage 
  //       onBack={handleBackToLanding}
  //     />
  //   )
  // }

  return (
    <>
      {summary && (
        <button className="back-button" style={{position: 'absolute', top: 20, left: 20, zIndex: 10}} onClick={handleBack}>
          &#8592; Back
        </button>
      )}
      <div className="card">
        {/* Show OnboardingWizard if authenticated but onboarding not completed */}
        {isAuthenticated && currentUser && currentUser.onboarding_completed === false && (
          <OnboardingWizard user={currentUser} onComplete={handleOnboardingComplete} />
        )}

        {/* Show main app if onboarding is completed or not required */}
        {/* ✅ 修復：FileUploadSelector 已完全移除，上傳功能由 MeetingUploadModal 處理 */}
        {/* Upload functionality is handled by MeetingUploadModal triggered from AnalyticsDashboard */}
        {/* FileUploadSelector removed - no longer needed */}
        
        {/* After file is uploaded, show transcript preview and generate summary UI */}
        {!summary && selectedFile && fileContent && !showAnalysisProgress && (
          <FileUpload
            selectedFile={selectedFile}
            fileContent={fileContent}
            isSummarizing={isSummarizing}
            isTranscribing={isTranscribing}
            transcriptionError={transcriptionError}
            handleBack={handleBack}
            summarizeText={summarizeTextWithEmail}
          />
        )}

        {/* Show analysis progress after email submission */}
        {showAnalysisProgress && !summary && (
          <AnalysisProgress
            userEmail={userEmail}
            onViewResults={() => {
              // Redirect to magic link verification page (consistent for all users)
              console.log('Redirecting to magic link verification page...')
              alert('🔗 Redirecting to email verification page...\n\nIn a real app, this would:\n1. Open magic link verification page\n2. User clicks email link to verify\n3. Then access results\n\nThis ensures consistent security for all users.')
            }}
            onStartNew={() => {
              setShowAnalysisProgress(false)
              handleBack()
            }}
          />
        )}

        {/* Show analysis progress during analysis even after summary is ready */}
        {showAnalysisProgress && summary && (
          <AnalysisProgress
            userEmail={userEmail}
            onViewResults={() => {
              // Redirect to magic link verification page (consistent for all users)
              console.log('Redirecting to magic link verification page...')
              alert('🔗 Redirecting to email verification page...\n\nIn a real app, this would:\n1. Open magic link verification page\n2. User clicks email link to verify\n3. Then access results\n\nThis ensures consistent security for all users.')
            }}
            onStartNew={() => {
              setShowAnalysisProgress(false)
              handleBack()
            }}
          />
        )}
        
        {/* Show main app only if onboarding is completed or not authenticated */}
        {/* T36 修復：簡化條件，避免依賴異步設置的 currentUser，減少時序問題 */}
        {/* 修復 Onboarding Wizard 測試：當 onboarding 未完成時，隱藏主應用程式 */}
        {/* ✅ 使用 shouldShowMainApp 變數確保條件一致 */}
        {shouldShowMainApp && (
          <div className="upload-section" style={{ 
            display: 'flex',
            flexDirection: 'column',
            height: '100vh',
            width: '100%',
            overflow: 'hidden'
          }}>
            {/* Show TopBar when user is authenticated OR when there's summary data OR during OAuth callback handling */}
            {/* ✅ 同時檢查狀態和 ref，確保 OAuth 登入過程中 TopBar 始終顯示 */}
            {(isAuthenticated || summary || isOAuthCallbackActive || oauthCallbackRef.current) && (
              <div style={{ flexShrink: 0, zIndex: 30 }}>
                <TopBar
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  isAuthenticated={isAuthenticated || !!summary || isOAuthCallbackActive || oauthCallbackRef.current}
                />
              </div>
            )}
            
            {/* ✅ 響應式佈局：TopNav 和主內容區域並排顯示 */}
            <div style={{
              display: 'flex',
              flexDirection: 'row',
              flex: 1,
              overflow: 'hidden',
              width: '100%'
            }}>
              {/* Show TopNav when user is authenticated OR when there's analysis data OR during OAuth callback */}
              {/* ✅ 同時檢查 oauthCallbackRef 以確保 OAuth callback 後也能顯示 TopNav */}
              {(isAuthenticated || summary || oauthCallbackRef.current) && (
                <TopNav
                  activeTab={activeTopTab}
                  onChange={handleTopTabChange}
                  isAuthenticated={isAuthenticated || oauthCallbackRef.current}
                  currentUser={currentUser}
                  onLogout={handleLogout}
                  clientViewMode={clientViewMode}
                  selectedClient={selectedClient}
                  selectedMeeting={selectedMeeting}
                  onBackToAllClients={handleBackToAllClients}
                  showClientDetails={showClientDetails}
                  selectedClientForDetails={selectedClientForDetails}
                  onCloseClientDetails={handleCloseClientDetails}
                  clientMeetings={clientMeetings}
                  onScrollToMeeting={handleScrollToMeeting}
                  onMeetingSelect={async (meeting) => {
                    try {
                      console.log('🔄 Loading full meeting details from TopNav for:', meeting.meeting_id)
                      const fullMeetingData = await apiService.getMeetingById(meeting.meeting_id)
                      console.log('✅ Full meeting data loaded from TopNav:', fullMeetingData)
                      setSelectedMeeting(fullMeetingData)
                      setMeetingId(meeting.meeting_id)
                    } catch (error) {
                      console.error('❌ Failed to load meeting details from TopNav:', error)
                      setSelectedMeeting(meeting)
                      if (meeting?.meeting_id) setMeetingId(meeting.meeting_id)
                    }
                  }}
                />
              )}
              
              {/* ✅ 主內容區域：使用 flex: 1 自動填充剩餘空間 */}
              <div style={{
                flex: 1,
                minWidth: 0,
                overflowY: 'auto',
                overflowX: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}>

            {isLoading && (
              <p className="loading">Processing file...</p>
            )}
            {/* T36 修復：使用 CSS 隱藏而非條件渲染，確保容器總是存在於 DOM 中 */}
            {!showClientDetails && (
              <div 
                style={{ 
                  padding: '20px',
                  display: activeTopTab === 'Clients' ? 'block' : 'none',  // CSS 隱藏而非卸載，確保 data-testid 總是存在
                  flex: 1,
                  overflowY: 'auto'
                }}
              >
                {clientViewMode === 'all-clients' ? (
                  <ClientsTable
                    rows={clients}
                    isLoading={isLoadingClients}
                    meetings={meetings}
                    onClientClick={handleClientClick}
                    onToggleFavorite={handleToggleFavoriteClient}
                    onEdit={handleEditClient}
                    onDelete={handleDeleteClient}
                  />
                ) : (
                  <>
                    {console.log('🟢 RENDERING MeetingDetailView:', {
                      hasSelectedMeeting: !!selectedMeeting,
                      hasSelectedClient: !!selectedClient,
                      clientViewMode: 'single-client',
                      meetingId: meetingId || selectedMeeting?.meeting_id || selectedMeeting?.id,
                      selectedMeetingKeys: selectedMeeting ? Object.keys(selectedMeeting) : []
                    })}
                    <MeetingDetailView
                      meeting={selectedMeeting}
                      client={selectedClient}
                      meetingId={meetingId || selectedMeeting?.meeting_id || selectedMeeting?.id}
                      clientMeetings={clientMeetings}
                    />
                  </>
                )}
              </div>
            )}

            {/* Client Details View */}
            {showClientDetails && selectedClientForDetails && (
              <div style={{ 
                padding: '20px',
                flex: 1,
                overflowY: 'auto',
                minWidth: 0
              }}>
                <ClientDetails
                  clientId={selectedClientForDetails.client_id}
                  onClose={handleCloseClientDetails}
                  onMeetingsLoaded={handleMeetingsLoaded}
                  onMeetingClick={handleMeetingClick}
                  client={selectedClientForDetails}
                />
              </div>
            )}
            {activeTopTab === 'Reels' && (
              <div 
                data-testid="reels-root" 
                data-ready={(!isLoadingReels).toString()} 
                style={{ 
                  padding: '20px',
                  flex: 1,
                  overflowY: 'auto'
                }}
              >
                <ReelsTable
                  rows={reels}
                  isLoading={isLoadingReels}
                  onToggleFavorite={handleToggleFavoriteReel}
                  onEdit={handleEditReel}
                  onDelete={handleDeleteReel}
                />
              </div>
            )}
            {activeTopTab === 'Settings' && (
              <div style={{ 
                padding: '40px',
                flex: 1,
                overflowY: 'auto'
              }}>
                <Integrations />
              </div>
            )}
            
            {/* Show AnalyticsDashboard when Dashboard tab is selected (activeTopTab is null) AND user is authenticated AND not showing client details */}
            {/* ✅ 同時檢查 oauthCallbackRef 以確保 OAuth callback 後也能顯示 Dashboard */}
            {/* ✅ 修復問題 1：即使分析進行中或模態框打開，也保持 AnalyticsDashboard 掛載（通過檢查 analysisInProgressRef 和模態框狀態） */}
            {/* ✅ 關鍵修復：移除 status='completed' 條件，只在分析進行中時保持 Dashboard 掛載（修復 overlay bug） */}
            {/* ✅ 關鍵修復：使用穩定的 key prop 確保組件在數據刷新時保持身份，防止不必要的卸載 */}
            {(activeTopTab === null || analysisInProgressRef.current || showUploadModal || showProgressModal || (currentAnalysis && currentAnalysis.status === 'processing')) && (isAuthenticated || oauthCallbackRef.current) && !showClientDetails && (
              <div style={{ 
                padding: '20px',
                flex: 1,
                overflowY: 'auto',
                minWidth: 0
              }}>
                <AnalyticsDashboard
                  key="analytics-dashboard" // ✅ 關鍵修復：使用穩定的 key 確保組件在數據刷新時保持身份
                  isAuthenticated={isAuthenticated || oauthCallbackRef.current}
                  currentUser={currentUser}
                  meetings={meetings}
                  clients={clients}
                  reels={reels}
                  dashboardStats={dashboardStats}  // ✅ 新增：傳遞統計數據
                  onNavigateToAnalysis={handleNavigateToAnalysis}  // ✅ 新增：傳遞導航回調
                  onRefreshDashboard={loadDashboardData}  // ✅ 新增：傳遞刷新 dashboard 數據的回調
                  canSubmitAnalysis={canSubmitAnalysis}  // ✅ Phase 2：速率限制
                  secondsUntilNextAnalysis={secondsUntilNextAnalysis}  // ✅ Phase 2：倒計時
                  onAnalysisSubmitted={handleAnalysisSubmitted}  // ✅ Phase 2：提交成功處理
                  onRateLimitError={handleRateLimitError}  // ✅ Phase 2：429 錯誤處理
                  onCurrentAnalysisChange={(analysisState) => {
                    // ✅ 關鍵修復：同步 currentAnalysis 狀態到父組件，讓 default routing 能檢查分析狀態
                    setCurrentAnalysis(analysisState)
                  }}
                  onAnalysisStateChange={(inProgress) => {
                    // ✅ 修復 BUG-2：追蹤分析狀態，防止默認路由在分析過程中觸發
                    analysisInProgressRef.current = inProgress
                    console.log('📊 Analysis state changed:', inProgress ? 'in progress' : 'completed/failed')
                    // ✅ 修復問題 1：如果分析進行中，確保 activeTopTab 保持為 null（防止組件卸載）
                    if (inProgress && activeTopTab !== null) {
                      console.log('🔧 Analysis in progress, keeping activeTopTab as null to prevent unmount')
                      setActiveTopTab(null)
                    }
                  }}
                  onModalStateChange={(modalState) => {
                    // ✅ 關鍵修復：同步模態框狀態到父組件，確保條件渲染正確
                    // ✅ 關鍵修復：先設置 showProgressModal = true，再設置 showUploadModal = false
                    // 這樣可以確保在狀態切換期間至少有一個模態框是打開的，防止組件被卸載
                    // 使用 React 的批量更新，但確保順序：先打開 progress modal，再關閉 upload modal
                    if (modalState.showProgressModal !== undefined) {
                      // 先設置 progress modal（無論是打開還是關閉）
                      setShowProgressModal(prev => {
                        const newValue = modalState.showProgressModal
                        if (prev !== newValue) {
                          console.log('📊 Updating showProgressModal:', prev, '->', newValue)
                        }
                        return newValue
                      })
                    }
                    // 使用 setTimeout 確保 progress modal 狀態更新後再更新 upload modal
                    // 但實際上，React 的批量更新會確保這兩個狀態更新在同一個渲染週期中完成
                    // 所以我們只需要確保順序：先設置 progress modal，再設置 upload modal
                    if (modalState.showUploadModal !== undefined) {
                      setShowUploadModal(prev => {
                        const newValue = modalState.showUploadModal
                        if (prev !== newValue) {
                          console.log('📊 Updating showUploadModal:', prev, '->', newValue)
                        }
                        return newValue
                      })
                    }
                    console.log('📊 Modal state changed:', modalState)
                  }}
                  onTabChange={handleTopTabChange}  // ✅ 修復 Dashboard overlay bug：分析完成後導航到指定標籤
                />
              </div>
            )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Login/Register Modal - New Implementation */}
      {showLoginPrompt && !isAuthenticated && (
        <div className="login-prompt-overlay">
          <div className="login-prompt">
            {showRegisterForm ? (
              <RegisterForm
                onSwitchToLogin={() => setShowRegisterForm(false)}
                onCancel={() => {
                  setShowLoginPrompt(false)
                  setShowRegisterForm(false)
                  // Landing page removed - if not authenticated, LoginPrompt will show again when needed
                }}
              />
            ) : (
              <>
                <LoginForm
                  onSwitchToRegister={() => setShowRegisterForm(true)}
                  onCancel={() => {
                    setShowLoginPrompt(false)
                    // Landing page removed - if not authenticated, LoginPrompt will show again when needed
                  }}
                />
                <GoogleLoginButton disabled={false} />
              </>
            )}
          </div>
        </div>
      )}

      {/* Client Selection Modal for Email Verification */}
      <ClientSelectionModal
        isOpen={showClientSelectionModal}
        onClose={() => {
          setShowClientSelectionModal(false)
          setVerificationData(null)
        }}
        onClientSelected={handleClientSelected}
        existingClients={clients}
        isLoading={isLoadingClientsModal}
        verificationData={verificationData}
      />
    </>
  )
}

export default App
