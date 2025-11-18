import React, { useState, useEffect, useRef, useMemo } from 'react'
import { createPortal } from 'react-dom'
import MeetingUploadModal from '../MeetingUploadModal/MeetingUploadModal'
import AnalysisProgressModal from '../AnalysisProgressModal/AnalysisProgressModal'
import { apiService } from '../../services/api'

// ✅ 關鍵修復：使用 React.memo 優化渲染，防止不必要的重新渲染
const AnalyticsDashboard = React.memo(({
  isAuthenticated,
  currentUser,
  meetings,
  clients,
  reels,
  onNavigateToAnalysis,
  dashboardStats,
  onRefreshDashboard,
  onAnalysisStateChange,
  onModalStateChange,
  onCurrentAnalysisChange,
  canSubmitAnalysis = true,  // ✅ Phase 2：速率限制
  secondsUntilNextAnalysis = 0,  // ✅ Phase 2：倒計時
  onAnalysisSubmitted,  // ✅ Phase 2：提交成功回調
  onRateLimitError,  // ✅ Phase 2：429 錯誤回調
  onTabChange  // ✅ 修復 overlay bug：分析完成後導航到其他標籤
}) => {
  const [stats, setStats] = useState({
    totalMeetings: 0,
    clientsServed: 0,
    reelsGenerated: 0,
    thisWeekUploads: 0
  })

  // Modal states
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showProgressModal, setShowProgressModal] = useState(false)
  const [currentAnalysis, setCurrentAnalysis] = useState(null)
  const [statusPollingInterval, setStatusPollingInterval] = useState(null)

  // ✅ 修復問題 1：當組件卸載時，只有在分析未進行時才關閉模態框
  // 使用 useRef 來追蹤分析狀態，避免閉包問題
  const analysisStatusRef = useRef(null)
  const pollingIntervalRef = useRef(null)
  
  // ✅ 關鍵修復：同步 ref 和 state，但優先使用直接設置的 ref 值（避免 useEffect 延遲）
  useEffect(() => {
    // 只有在 ref 還沒有被直接設置時才從 state 同步
    if (analysisStatusRef.current === null || analysisStatusRef.current === undefined) {
      analysisStatusRef.current = currentAnalysis?.status
    }
    // pollingIntervalRef 在 startStatusPolling 中直接設置，這裡只作為備份同步
    if (pollingIntervalRef.current === null || pollingIntervalRef.current === undefined || pollingIntervalRef.current === 'pending') {
      pollingIntervalRef.current = statusPollingInterval
    }
  }, [currentAnalysis, statusPollingInterval])
  
  // ✅ 修復問題：使用 ref 追蹤模態框狀態，避免閉包問題
  const showUploadModalRef = useRef(false)
  const showProgressModalRef = useRef(false)
  
  // ✅ 關鍵修復：使用 ref 存儲回調函數，避免依賴項變化導致 cleanup 被頻繁觸發
  const onAnalysisStateChangeRef = useRef(onAnalysisStateChange)
  const onModalStateChangeRef = useRef(onModalStateChange)
  const onTabChangeRef = useRef(onTabChange)  // ✅ 修復陳舊閉包：為 onTabChange 創建 Ref
  
  // 同步 ref 和 state
  useEffect(() => {
    showUploadModalRef.current = showUploadModal
    showProgressModalRef.current = showProgressModal
    onAnalysisStateChangeRef.current = onAnalysisStateChange
    onModalStateChangeRef.current = onModalStateChange
    onTabChangeRef.current = onTabChange  // ✅ 修復陳舊閉包：同步 onTabChange Ref
  }, [showUploadModal, showProgressModal, onAnalysisStateChange, onModalStateChange, onTabChange])
  
  // ✅ 關鍵修復：只在組件真正卸載時執行 cleanup，不依賴 onAnalysisStateChange
  // 這樣可以避免因為回調函數引用變化而頻繁觸發 cleanup
  useEffect(() => {
    return () => {
      // ✅ 關鍵修復：使用 ref 來獲取最新狀態，避免閉包問題
      // 檢查 analysisStatusRef 或 pollingIntervalRef（包括 'pending' 狀態和實際 interval）
      const hasPollingInterval = pollingIntervalRef.current !== null && pollingIntervalRef.current !== undefined && pollingIntervalRef.current !== 'pending'
      const isPollingPending = pollingIntervalRef.current === 'pending'
      const isAnalysisInProgress = analysisStatusRef.current === 'processing' || hasPollingInterval || isPollingPending
      const uploadModalOpen = showUploadModalRef.current
      const progressModalOpen = showProgressModalRef.current
      
      console.log('🧹 AnalyticsDashboard unmounting check:')
      console.log('  - analysisStatusRef.current:', analysisStatusRef.current)
      console.log('  - pollingIntervalRef.current:', pollingIntervalRef.current)
      console.log('  - pollingIntervalRef type:', typeof pollingIntervalRef.current)
      console.log('  - pollingIntervalRef === pending:', pollingIntervalRef.current === 'pending')
      console.log('  - hasPollingInterval:', hasPollingInterval)
      console.log('  - isPollingPending:', isPollingPending)
      console.log('  - isAnalysisInProgress:', isAnalysisInProgress)
      console.log('  - uploadModalOpen:', uploadModalOpen)
      console.log('  - progressModalOpen:', progressModalOpen)
      console.log('  - showProgressModal state:', showProgressModal)
      console.log('  - showUploadModal state:', showUploadModal)
      
      // ✅ 關鍵修復：如果分析正在進行，不執行任何清理（模態框通過 Portal 渲染，不受組件卸載影響）
      if (isAnalysisInProgress) {
        console.log('⚠️ Preventing cleanup during analysis - modals managed by parent via Portal')
        console.log('  - analysisStatusRef:', analysisStatusRef.current)
        console.log('  - pollingIntervalRef:', pollingIntervalRef.current)
        // 只清理實際的 polling interval（不是 'pending'），不清除狀態（避免影響父組件）
        if (pollingIntervalRef.current && pollingIntervalRef.current !== 'pending' && typeof pollingIntervalRef.current !== 'string') {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        // 不清除 analysisStatusRef 和模態框狀態，讓父組件知道分析正在進行
        return
      }
      
      // ✅ 關鍵修復：如果模態框打開，也不執行清理（模態框通過 Portal 渲染，保持打開）
      if (uploadModalOpen || progressModalOpen) {
        console.log('⚠️ Preventing cleanup while modals open - modals managed by parent via Portal')
        // 只清理 polling interval（如果有的話）
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        return
      }
      
      // ✅ 關鍵修復：只有在真正需要清理時才執行（分析未進行、模態框未打開、且不是因為數據刷新導致的重新渲染）
      // 檢查是否是因為數據刷新導致的重新渲染（通過檢查父組件的 currentAnalysis 狀態）
      // 如果父組件有 currentAnalysis，說明分析可能還在進行，不應該清理
      console.log('🧹 AnalyticsDashboard unmounting: cleaning up (analysis not in progress, modals not open)')
      
      // ✅ 關鍵修復：不要清除模態框狀態，讓父組件管理（通過 Portal 渲染，不受組件卸載影響）
      // setShowUploadModal(false)  // ❌ 移除：讓父組件管理
      // setShowProgressModal(false)  // ❌ 移除：讓父組件管理
      // setCurrentAnalysis(null)  // ❌ 移除：讓父組件管理
      
      // ✅ 關鍵修復：只有在真正需要時才清除分析狀態標記
      // 如果模態框還在打開（由父組件管理），不應該清除狀態
      // 檢查父組件的模態框狀態（通過 ref 回調）
      // 但由於我們無法直接訪問父組件狀態，這裡只清理 polling interval
      
      // 清理 polling interval
      if (pollingIntervalRef.current && pollingIntervalRef.current !== 'pending' && typeof pollingIntervalRef.current !== 'string') {
        clearInterval(pollingIntervalRef.current)
        pollingIntervalRef.current = null
      }
      
      // ✅ 關鍵修復：不要清除分析狀態標記，讓父組件通過模態框狀態來判斷
      // 這樣可以防止在數據刷新時錯誤清除狀態
      // if (onAnalysisStateChangeRef.current) {
      //   onAnalysisStateChangeRef.current(false)  // ❌ 移除：讓父組件通過模態框狀態判斷
      // }
    }
    // ✅ 關鍵修復：移除依賴項，只在組件真正卸載時執行 cleanup
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // ✅ 優先使用 dashboardStats，如果未提供則使用 props 計算（向後兼容）
    if (dashboardStats) {
      // ✅ 使用 API 返回的統計數據（立即顯示）
      setStats({
        totalMeetings: dashboardStats.totalMeetings || 0,
        clientsServed: dashboardStats.clientsServed || 0,
        reelsGenerated: dashboardStats.reelsGenerated || 0,
        thisWeekUploads: dashboardStats.thisWeekUploads || 0
      })
      console.log('✅ Using dashboard stats from API:', dashboardStats)
    } else {
      // ✅ 向後兼容：如果未提供 dashboardStats，使用 props 計算
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

      const thisWeekMeetings = meetings.filter(meeting => {
        const meetingDate = new Date(meeting.created_at || meeting.meeting_date)
        return meetingDate >= oneWeekAgo
      })

      setStats({
        totalMeetings: meetings.length,
        clientsServed: clients.length,
        reelsGenerated: reels.length,
        thisWeekUploads: thisWeekMeetings.length
      })
      console.log('⚠️ Dashboard stats not provided, calculating from props')
    }
  }, [dashboardStats, meetings, clients, reels])

  // ✅ 修復 BUG-3：使用 API 返回的 recentActivity（包含正確格式的日期），而不是本地構建
  // 優先級：dashboardStats.recentActivity > 不顯示任何內容（防止 "Invalid Date"）
  const recentActivity = useMemo(() => {
    // ✅ 第一優先：使用 API 返回的 recentActivity（已由後端格式化為 "X hours ago" 等相對時間）
    if (dashboardStats?.recentActivity && dashboardStats.recentActivity.length > 0) {
      console.log('✅ BUG-3 FIX: Using recentActivity from API response:', dashboardStats.recentActivity.length, 'items')
      return dashboardStats.recentActivity
    }

    // ❌ 不再回退到本地構建！即使 dashboardStats 沒有 recentActivity，也不生成 "Invalid Date"
    // 這防止了 .toLocaleDateString() 生成的 "Invalid Date" 字符串
    console.log('⚠️ BUG-3 DEBUG: recentActivity not available, showing empty list (prevent Invalid Date)')
    return []
  }, [dashboardStats?.recentActivity])

  // Status polling functions
  const startStatusPolling = (meetingId) => {
    console.log('🔄 Starting status polling for meeting:', meetingId)

    // ✅ 關鍵修復：使用 ignore flag 防止過時的異步操作更新狀態（React 官方推薦模式）
    let ignore = false

    // ⏱️ 3 分鐘超時保護：防止無限輪詢
    const POLLING_TIMEOUT = 180 * 1000 // 180 秒 = 3 分鐘
    const pollingStartTime = Date.now()

    const pollStatus = async () => {
      try {
        // ✅ 關鍵修復：檢查 ignore flag，防止組件卸載後更新狀態
        if (ignore) {
          console.log('⏭️ Skipping poll - component unmounted or polling stopped')
          return
        }

        // ⏱️ 檢查是否超過 3 分鐘輪詢超時
        const elapsedTime = Date.now() - pollingStartTime
        if (elapsedTime > POLLING_TIMEOUT) {
          console.warn(`⏰ Polling timeout reached (${Math.round(elapsedTime / 1000)}s > 180s)`)
          console.warn('⏰ Analysis took too long, stopping polling. Status may not be updated.')
          ignore = true
          stopStatusPolling()
          return
        }

        const status = await apiService.getMeetingStatus(meetingId)

        // ✅ 關鍵修復：再次檢查 ignore flag，防止異步操作完成後更新狀態
        if (ignore) {
          console.log('⏭️ Skipping status update - component unmounted or polling stopped')
          return
        }

        console.log('📊 Polling status:', status)

        // ✅ 關鍵修復：檢查狀態是否從非 completed 變為 completed
        setCurrentAnalysis(prev => {
          const wasCompleted = prev?.status === 'completed'
          const isNowCompleted = status === 'completed'

          // ✅ 當分析完成時，自動刷新 dashboard 數據（只執行一次）
          if (isNowCompleted && !wasCompleted) {
            console.log('✅ Analysis completed! Auto-refreshing dashboard data...')
            // ✅ 關鍵修復：立即刷新，不需要延遲（因為我們已經不清除分析狀態，組件不會被卸載）
            // 保持模態框打開，讓用戶可以看到完成狀態，同時數據會及時更新
            if (onRefreshDashboard) {
              onRefreshDashboard()
            }
          }

          const newState = prev ? { ...prev, status } : null

          // ✅ 關鍵修復：同步 currentAnalysis 狀態到父組件
          if (onCurrentAnalysisChange) {
            onCurrentAnalysisChange(newState)
          }

          return newState
        })

        // Stop polling if analysis is complete or failed
        if (status === 'completed' || status === 'failed') {
          console.log('⏹️ Stopping status polling - final status:', status)
          ignore = true // ✅ 關鍵修復：設置 ignore flag，防止後續異步操作更新狀態
          stopStatusPolling()

          // ✅ 關鍵修復：不要立即清除分析狀態標記，保持模態框打開
          // 只有在用戶明確關閉模態框時才清除狀態
          // 這樣可以防止在 dashboard 刷新過程中組件被卸載
          console.log('📊 Analysis', status, '- keeping state to prevent unmount during refresh')
        }
      } catch (error) {
        // ✅ 關鍵修復：檢查 ignore flag，防止錯誤處理時更新狀態
        if (ignore) {
          console.log('⏭️ Skipping error handling - component unmounted or polling stopped')
          return
        }
        console.error('❌ Error polling status:', error)
        // Don't stop polling on error, just log it
      }
    }

    // ✅ 關鍵修復：先同步設置 ref，確保即使組件立即卸載也能正確判斷
    const interval = setInterval(() => {
      // ✅ 關鍵修復：在每次輪詢前檢查 ignore flag
      if (!ignore) {
        pollStatus()
      }
    }, 3000)
    pollingIntervalRef.current = interval
    
    console.log('✅ Polling interval ref updated with actual interval (replaced pending)')
    console.log('  - pollingIntervalRef.current:', pollingIntervalRef.current)
    console.log('  - pollingIntervalRef type:', typeof pollingIntervalRef.current)
    
    // 然後設置 state（異步，但 ref 已經設置）
    setStatusPollingInterval(interval)
    
    // Poll immediately after setting up interval
    pollStatus()
  }
  
  const stopStatusPolling = () => {
    if (statusPollingInterval) {
      clearInterval(statusPollingInterval)
      setStatusPollingInterval(null)
    }
  }
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      stopStatusPolling()
    }
  }, [statusPollingInterval])

  // ✅ 修復：當 activeTopTab 改變時（切換頁面），關閉所有模態框
  // 這個 useEffect 會在組件仍然掛載但頁面切換時觸發
  // 但實際上，當 activeTopTab !== null 時，AnalyticsDashboard 組件會被卸載
  // 所以這個主要是為了確保狀態清理

  // Modal handlers
  const handleAnalyzeMeeting = async () => {
    // ✅ 關鍵修復：先通知父組件模態框狀態變化，確保父組件狀態更新後再設置本地狀態
    // 這樣可以確保條件渲染在父組件狀態更新後才評估
    if (onModalStateChangeRef.current) {
      console.log('📊 Notifying parent: upload modal opening')
      onModalStateChangeRef.current({ showUploadModal: true, showProgressModal: false })
      // ✅ 關鍵修復：等待更長時間，確保父組件的狀態更新完成
      await new Promise(resolve => setTimeout(resolve, 100))
    }
    // 然後設置本地狀態
    setShowUploadModal(true)
    console.log('✅ Upload modal state set locally')
  }

  const handleStartAnalysis = async (analysisData) => {
    // ✅ 修復：clientName 定義在 try-catch 外，避免 catch 區塊無法訪問
    let clientName = null

    try {
      console.log('🚀 Starting analysis with data:', analysisData)
      console.log('  - File:', analysisData.file?.name)
      console.log('  - Client option:', analysisData.clientOption)
      console.log('  - Client ID:', analysisData.clientId)
      console.log('  - Client name:', analysisData.clientName)

      // ✅ 關鍵修復：先同步設置父組件的 ref，確保條件渲染能正確判斷
      // 這樣即使組件在狀態更新完成前被卸載，也能正確判斷分析正在進行
      if (onAnalysisStateChangeRef.current) {
        console.log('📊 Setting analysis state to in-progress')
        // ✅ 關鍵修復：先同步設置 ref（通過回調），然後再等待狀態更新
        onAnalysisStateChangeRef.current(true)
        // ✅ 關鍵修復：等待更長時間，確保父組件的 ref 和狀態都更新完成
        await new Promise(resolve => setTimeout(resolve, 100))
        console.log('✅ Analysis state updated, ref should be set now')
      }

      // Set current analysis data
      clientName = analysisData.clientOption === 'new'
        ? analysisData.clientName
        : clients.find(c => c.client_id === analysisData.clientId)?.name
      
      console.log('📝 Setting current analysis data, client name:', clientName)
      
      // ✅ 關鍵修復：先同步設置 ref，確保組件卸載檢查能正確判斷
      // 這樣即使組件在狀態更新完成前被卸載，也能正確判斷分析正在進行
      analysisStatusRef.current = 'processing'
      // ✅ 關鍵修復：設置一個標記表示輪詢即將開始，防止在 API 調用期間組件被卸載
      // 使用 'pending' 作為標記，表示輪詢即將開始（臨時設置，稍後會被實際 interval 替換）
      pollingIntervalRef.current = 'pending' // 使用 'pending' 作為標記，表示輪詢即將開始
      console.log('✅ Analysis status ref set to processing (synchronously)')
      console.log('✅ Polling interval ref set to pending (synchronously)')
      
      const newAnalysisState = {
        fileName: analysisData.file.name,
        clientName: clientName,
        meetingId: null, // Will be set after API call
        status: 'processing'
      }
      setCurrentAnalysis(newAnalysisState)
      
      // ✅ 關鍵修復：同步 currentAnalysis 狀態到父組件，讓父組件能檢查分析狀態
      if (onCurrentAnalysisChange) {
        onCurrentAnalysisChange(newAnalysisState)
      }
      
      // ✅ 關鍵修復：先打開 progress modal，再關閉 upload modal，確保在狀態切換期間至少有一個模態框打開
      // 這樣可以防止組件在狀態切換期間被卸載
      console.log('🔄 Opening progress modal first (before closing upload modal)')
      setShowProgressModal(true)
      
      // ✅ 關鍵修復：先通知父組件模態框狀態變化，確保條件渲染正確
      // 先設置 showProgressModal = true，再設置 showUploadModal = false
      if (onModalStateChangeRef.current) {
        console.log('📊 Notifying parent: progress modal opening, upload modal closing')
        onModalStateChangeRef.current({ showUploadModal: false, showProgressModal: true })
        // ✅ 關鍵修復：等待更長時間，確保父組件的狀態更新完成
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // ✅ 關鍵修復：等待狀態更新完成，確保 ref 和 state 同步
      await new Promise(resolve => setTimeout(resolve, 50))
      
      // ✅ 關鍵修復：現在才關閉 upload modal（在 progress modal 已經打開後）
      console.log('🔄 Closing upload modal (progress modal already open)')
      setShowUploadModal(false)
      
      // Call authenticated analysis API
      console.log('📡 Calling analyzeAuthenticatedMeeting API...')
      const response = await apiService.analyzeAuthenticatedMeeting(analysisData)
      console.log('📡 API response:', response)
      
      if (response && response.success) {
        console.log('✅ Analysis started successfully:', response.meetingId)
        
        // Update analysis data with meeting ID
        setCurrentAnalysis(prev => {
          const newState = prev ? { ...prev, meetingId: response.meetingId } : null
          // ✅ 關鍵修復：同步 currentAnalysis 狀態到父組件
          if (onCurrentAnalysisChange) {
            onCurrentAnalysisChange(newState)
          }
          return newState
        })
        
        // Start polling for status updates
        console.log('🔄 Starting status polling for meeting:', response.meetingId)
        startStatusPolling(response.meetingId)

        // ✅ Phase 2：通知父組件分析已提交（用於速率限制）
        if (onAnalysisSubmitted) {
          console.log('⏱️ Notifying parent component: analysis submitted')
          onAnalysisSubmitted(0)  // 立即開始倒計時
        }
      } else {
        const errorMsg = response?.message || response?.error || 'Analysis failed to start'
        console.error('❌ Analysis failed:', errorMsg)
        throw new Error(errorMsg)
      }

    } catch (error) {
      console.error('❌ Error starting analysis:', error)
      console.error('  - Error message:', error.message)
      console.error('  - Error stack:', error.stack)

      // ✅ Phase 2：檢查是否為 429 速率限制錯誤
      if (error.status === 429 || (error.response && error.response.status === 429)) {
        const nextAvailableIn = error.nextAvailableIn || 30
        console.log('⏱️ Rate limit error detected, seconds remaining:', nextAvailableIn)
        if (onRateLimitError) {
          onRateLimitError(nextAvailableIn)
        }
      }

      // ✅ 關鍵修復：保持模態框打開，顯示錯誤狀態
      // 不要立即清除分析狀態和關閉模態框，讓用戶可以看到錯誤訊息
      const errorMessage = error.message || 'Unknown error occurred'

      // 確保進度模態框顯示錯誤狀態（保持打開）
      const errorState = currentAnalysis ? {
        ...currentAnalysis,
        status: 'failed',
        errorMessage: errorMessage  // 保存錯誤訊息供模態框顯示
      } : {
        fileName: analysisData.file?.name || 'Unknown',
        clientName: clientName || 'Unknown',
        meetingId: null,
        status: 'failed',
        errorMessage: errorMessage
      }
      setCurrentAnalysis(errorState)

      // ✅ 關鍵修復：同步 currentAnalysis 狀態到父組件
      if (onCurrentAnalysisChange) {
        onCurrentAnalysisChange(errorState)
      }
      
      // ✅ 關鍵修復：不要清除分析狀態標記，保持模態框打開
      // 這樣即使 API 失敗，模態框也會保持打開，顯示錯誤狀態
      // 只有在用戶明確關閉模態框時才清除狀態
      // if (onAnalysisStateChange) {
      //   onAnalysisStateChange(false)  // ❌ 移除：保持分析狀態，防止組件卸載
      // }
      
      // ✅ 關鍵修復：不要立即關閉模態框，讓錯誤狀態顯示
      // 模態框會根據 currentAnalysis.status === 'failed' 顯示錯誤訊息
      // setShowProgressModal(false)  // ❌ 移除：保持模態框打開
      
      // ✅ 不顯示 alert，讓模態框顯示錯誤狀態（更友好的 UX）
      // alert(`Failed to start analysis: ${errorMessage}`)  // ❌ 移除：使用模態框顯示錯誤
      
      console.log('⚠️ Analysis failed, but keeping modal open to show error state')
    }
  }

  const handleCheckItOut = () => {
    // ✅ 修復：點擊 "Check it out" 後應該導向 Dashboard，而不是分析頁面
    // 關閉進度模態框並刷新 Dashboard 數據
    setShowProgressModal(false)
    setCurrentAnalysis(null)

    // ✅ 關鍵修復：同步 currentAnalysis 狀態到父組件
    if (onCurrentAnalysisChange) {
      onCurrentAnalysisChange(null)
    }

    // ✅ 修復 BUG-2：清除分析狀態標記（使用 ref 避免依賴項問題）
    if (onAnalysisStateChangeRef.current) {
      onAnalysisStateChangeRef.current(false)
    }

    // ✅ 關鍵修復：同步模態框狀態到父組件（THIS WAS THE MISSING PIECE!）
    // ✅ 修復陳舊閉包：使用 Ref 版本以確保調用最新的回調函數
    if (onModalStateChangeRef.current) {
      console.log('📊 Closing progress modal and notifying parent')
      onModalStateChangeRef.current({ showUploadModal: false, showProgressModal: false })
    }

    // 刷新 Dashboard 數據以顯示最新的分析結果
    if (onRefreshDashboard) {
      console.log('🔄 Refreshing dashboard data after analysis completion')
      onRefreshDashboard()
    }

    // ✅ 修復 Dashboard overlay bug：分析完成後導航到 Clients 標籤
    // 這樣可以確保 activeTopTab !== null，Dashboard 會被隱藏
    // 然後用戶可以再次點擊 Dashboard 標籤查看最新的分析結果
    // ✅ 修復陳舊閉包：使用 Ref 版本以確保調用最新的回調函數
    if (onTabChangeRef.current) {
      console.log('📊 Analysis complete, navigating to Clients to refresh UI')
      onTabChangeRef.current('Clients')
    }
  }

  const handleCloseProgressModal = () => {
    stopStatusPolling()
    setShowProgressModal(false)
    setCurrentAnalysis(null)

    // ✅ 關鍵修復：同步 currentAnalysis 狀態到父組件
    if (onCurrentAnalysisChange) {
      onCurrentAnalysisChange(null)
    }

    // ✅ 修復 BUG-2：清除分析狀態標記（使用 ref 避免依賴項問題）
    if (onAnalysisStateChangeRef.current) {
      onAnalysisStateChangeRef.current(false)
    }

    // ✅ 修復排版問題：同步模態框狀態到父組件（防止 Dashboard overlay）
    // 這個步驟是關鍵，確保父組件的 showProgressModal 被正確清除
    if (onModalStateChangeRef.current) {
      console.log('📊 Closing progress modal and notifying parent (handleCloseProgressModal)')
      onModalStateChangeRef.current({ showUploadModal: false, showProgressModal: false })
    }

    // ✅ 關鍵修復：關閉 modal 後重新載入 dashboard 數據，確保數據即時更新
    if (onRefreshDashboard) {
      console.log('🔄 Refreshing dashboard data after closing progress modal')
      onRefreshDashboard()
    }

    // ✅ 修復排版問題：導航到 Clients 標籤（防止 Dashboard overlay）
    // 確保 activeTopTab !== null，這樣 Dashboard 會被正確隱藏
    if (onTabChangeRef.current) {
      console.log('📊 Navigating to Clients after closing progress modal')
      onTabChangeRef.current('Clients')
    }
  }

  // ✅ 修復排版問題："Try Again" 按鈕專用處理函數
  // 清除失敗的分析狀態，並重新打開上傳模態框讓用戶重新上傳
  const handleTryAgain = () => {
    console.log('🔄 Try Again clicked - resetting and reopening upload modal')

    // 停止輪詢並清除分析狀態
    stopStatusPolling()
    setCurrentAnalysis(null)

    // ✅ 同步狀態到父組件
    if (onCurrentAnalysisChange) {
      onCurrentAnalysisChange(null)
    }

    // ✅ 清除分析狀態標記
    if (onAnalysisStateChangeRef.current) {
      onAnalysisStateChangeRef.current(false)
    }

    // ✅ 關鍵：關閉進度模態框，重新打開上傳模態框
    setShowProgressModal(false)
    setShowUploadModal(true)

    // ✅ 同步模態框狀態到父組件
    if (onModalStateChangeRef.current) {
      console.log('📊 Switching from progress modal to upload modal')
      onModalStateChangeRef.current({ showUploadModal: true, showProgressModal: false })
    }

    // ✅ 刷新 Dashboard 數據
    if (onRefreshDashboard) {
      console.log('🔄 Refreshing dashboard data after try again')
      onRefreshDashboard()
    }
  }

  if (!isAuthenticated) {
    return (
      <div style={{ padding: '32px', textAlign: 'center' }}>
        <h2>Please log in to view your dashboard</h2>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 24px', background: '#f9fafb', minHeight: '100%', width: '100%' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#1f2937', marginBottom: '8px', letterSpacing: '-0.02em' }}>
            Welcome back, {currentUser?.email || 'Coach'}
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.5' }}>
            Here's what's happening with your coaching practice
          </p>
        </div>

        {/* Quick Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px', marginBottom: '32px' }}>
          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#2563eb', marginBottom: '6px', lineHeight: '1.2' }}>
              {dashboardStats ? stats.totalMeetings : '...'}  {/* ✅ 顯示 Loading 或數字 */}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Total Meetings Analyzed</div>
          </div>

          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#059669', marginBottom: '6px', lineHeight: '1.2' }}>
              {dashboardStats ? stats.clientsServed : '...'}  {/* ✅ 顯示 Loading 或數字 */}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Clients Served</div>
          </div>

          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#d97706', marginBottom: '6px', lineHeight: '1.2' }}>
              {dashboardStats ? stats.reelsGenerated : '...'}  {/* ✅ 顯示 Loading 或數字 */}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>Reels Generated</div>
          </div>

          <div style={{ background: '#ffffff', padding: '20px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
            <div style={{ fontSize: '28px', fontWeight: '700', color: '#0891b2', marginBottom: '6px', lineHeight: '1.2' }}>
              {dashboardStats ? stats.thisWeekUploads : '...'}  {/* ✅ 顯示 Loading 或數字 */}
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280', fontWeight: '500' }}>This Week's Uploads</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '20px' }}>
          {/* Recent Activity */}
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', letterSpacing: '-0.01em' }}>
              Recent Activity
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {recentActivity.length > 0 ? recentActivity.map((activity, index) => (
                <div key={activity.meeting_id || index} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '8px 0' }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: activity.type === 'meeting_analyzed' ? '#2563eb' : '#059669',
                    marginTop: '6px',
                    flexShrink: 0
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', color: '#374151', lineHeight: '1.5', marginBottom: '4px' }}>
                      {activity.type === 'meeting_analyzed'
                        ? `Meeting analyzed for ${activity.client}${activity.meeting_title ? ` (${activity.meeting_title})` : ''}`
                        : `Reels generated${activity.client ? ` for ${activity.client}` : ''}`
                      }
                    </div>
                    {/* ✅ 修復 BUG-3：顯示後端返回的格式化日期（"X hours ago" 等），而不是本地轉換 */}
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      {activity.date && !activity.date.includes('Invalid')
                        ? activity.date
                        : 'Recently'
                      }
                    </div>
                  </div>
                </div>
              )) : (
                <div style={{ textAlign: 'center', color: '#6b7280', padding: '24px', fontSize: '14px' }}>
                  No recent activity
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div style={{ background: '#ffffff', padding: '24px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)', border: '1px solid #f3f4f6', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px', letterSpacing: '-0.01em' }}>
              Start a New Analysis
            </h3>
            <button 
              style={{
                background: '#2563eb',
                color: 'white',
                border: 'none',
                padding: '14px 28px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '15px',
                fontWeight: '600',
                transition: 'background-color 0.2s ease',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
              }}
              onClick={handleAnalyzeMeeting}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#1d4ed8'
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#2563eb'
              }}
            >
              🚀 Analyze New Meeting
            </button>
          </div>
        </div>
      </div>

      {/* Meeting Upload Modal - Only show when Dashboard is active */}
      {/* ✅ 關鍵修復：使用 React Portal 渲染模態框到 document.body，避免受組件生命週期影響 */}
      {showUploadModal && createPortal(
        <MeetingUploadModal
          isOpen={showUploadModal}
          onClose={async () => {
            console.log('🔒 Closing upload modal')
            // ✅ 關鍵修復：先通知父組件，確保狀態同步（使用 ref 避免依賴項問題）
            if (onModalStateChangeRef.current) {
              onModalStateChangeRef.current({ showUploadModal: false, showProgressModal: false })
              await new Promise(resolve => setTimeout(resolve, 0))
            }
            setShowUploadModal(false)
          }}
          onAnalyze={handleStartAnalysis}
          clients={clients}
          isLoading={false}
          canSubmitAnalysis={canSubmitAnalysis}  // ✅ Phase 2：速率限制
          secondsRemaining={secondsUntilNextAnalysis}  // ✅ Phase 2：倒計時
        />,
        document.body
      )}

      {/* Analysis Progress Modal - 使用 Portal 渲染 */}
      {showProgressModal && createPortal(
        <AnalysisProgressModal
          isOpen={showProgressModal}
          onClose={currentAnalysis?.status === 'failed' ? handleTryAgain : handleCloseProgressModal}
          onCheckItOut={handleCheckItOut}
          meetingId={currentAnalysis?.meetingId}
          fileName={currentAnalysis?.fileName}
          clientName={currentAnalysis?.clientName}
          analysisStatus={currentAnalysis?.status || 'processing'}
          errorMessage={currentAnalysis?.errorMessage || null}
        />,
        document.body
      )}
    </div>
  )
}, (prevProps, nextProps) => {
  // ✅ 關鍵修復：自定義比較函數，只在關鍵 props 變化時重新渲染
  // 忽略 dashboardStats 的變化（因為它會頻繁更新），只關注真正影響渲染的 props
  return (
    prevProps.isAuthenticated === nextProps.isAuthenticated &&
    prevProps.currentUser === nextProps.currentUser &&
    prevProps.meetings === nextProps.meetings &&
    prevProps.clients === nextProps.clients &&
    prevProps.reels === nextProps.reels &&
    prevProps.onNavigateToAnalysis === nextProps.onNavigateToAnalysis &&
    prevProps.onRefreshDashboard === nextProps.onRefreshDashboard &&
    prevProps.onAnalysisStateChange === nextProps.onAnalysisStateChange &&
    prevProps.onModalStateChange === nextProps.onModalStateChange &&
    prevProps.onCurrentAnalysisChange === nextProps.onCurrentAnalysisChange &&
    prevProps.onTabChange === nextProps.onTabChange  // ✅ 修復 Dashboard overlay bug：檢查 onTabChange 回調以防止陳舊閉包
    // ✅ 關鍵修復：不比較 dashboardStats，因為它會頻繁更新，但不會影響組件的核心功能
  )
})

AnalyticsDashboard.displayName = 'AnalyticsDashboard'

export default AnalyticsDashboard