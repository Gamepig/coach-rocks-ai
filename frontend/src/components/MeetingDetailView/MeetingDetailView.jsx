import React, { useState, useCallback, useEffect, useRef } from 'react'
import MeetingRecordingLink from '../MeetingRecordingLink.jsx'
import { apiService } from '../../services/api.js'
import { MindMapViewer } from '../Diagram/MindMapViewer'

// Function to format nextMeetingPrep data with bulleted lists
function formatNextMeetingPrep(data) {
  if (typeof data === 'string') {
    return data
  }

  if (!data || typeof data !== 'object') {
    return JSON.stringify(data, null, 2)
  }

  let formatted = ''

  // Helper function to convert arrays to bulleted lists
  const formatBulletList = (items) => {
    if (Array.isArray(items) && items.length > 0) {
      return items.map(item => `• ${item}`).join('\n')
    } else if (typeof items === 'string') {
      return items
    }
    return ''
  }

  // Overall Insights section
  if (data.overallInsights) {
    formatted += '🎯 OVERALL INSIGHTS\n'
    formatted += '═══════════════════════════════════════\n\n'

    if (data.overallInsights.overallClientGoals) {
      formatted += 'Client Goals:\n'
      formatted += formatBulletList(data.overallInsights.overallClientGoals) + '\n\n'
    }

    if (data.overallInsights.recurringPainPoints) {
      formatted += 'Recurring Pain Points:\n'
      formatted += formatBulletList(data.overallInsights.recurringPainPoints) + '\n\n'
    }

    if (data.overallInsights.successfulStrategies) {
      formatted += 'Successful Strategies:\n'
      formatted += formatBulletList(data.overallInsights.successfulStrategies) + '\n\n'
    }

    if (data.overallInsights.areasOfStagnation) {
      formatted += 'Areas of Stagnation:\n'
      formatted += formatBulletList(data.overallInsights.areasOfStagnation) + '\n\n'
    }
  }

  // Quick Overview
  if (data.quickOverview) {
    formatted += 'QUICK OVERVIEW\n'
    formatted += '═══════════════════════════════════════\n'
    formatted += data.quickOverview + '\n\n'
  }

  // Client Progress Assessment
  if (data.clientProgressAssessment) {
    formatted += 'CLIENT PROGRESS ASSESSMENT\n'
    formatted += '═══════════════════════════════════════\n'
    formatted += data.clientProgressAssessment + '\n\n'
  }

  // Current Journey Status
  if (data.currentJourneyStatus) {
    formatted += 'CURRENT JOURNEY STATUS\n'
    formatted += '═══════════════════════════════════════\n'
    formatted += data.currentJourneyStatus + '\n\n'
  }

  // Key Areas to Address
  if (data.keyAreasToAddress) {
    formatted += 'KEY AREAS TO ADDRESS\n'
    formatted += '═══════════════════════════════════════\n'
    formatted += formatBulletList(data.keyAreasToAddress) + '\n\n'
  }

  // Potential New Discussion Points
  if (data.potentialNewDiscussionPoints) {
    formatted += 'POTENTIAL NEW DISCUSSION POINTS\n'
    formatted += '═══════════════════════════════════════\n'
    formatted += formatBulletList(data.potentialNewDiscussionPoints) + '\n\n'
  }

  // Recommended Mindset
  if (data.recommendedMindset) {
    formatted += 'RECOMMENDED MINDSET\n'
    formatted += '═══════════════════════════════════════\n'
    formatted += data.recommendedMindset + '\n'
  }

  return formatted.trim()
}

export default function MeetingDetailView({ meeting, client, meetingId: meetingIdProp, clientMeetings }) {
  console.log('🟠 COMPONENT RENDER - MeetingDetailView')
  console.log('🟠 - meeting prop:', meeting ? 'EXISTS' : 'NULL')
  console.log('🟠 - client prop:', client ? 'EXISTS' : 'NULL')
  console.log('🟠 - meetingId prop:', meetingIdProp || 'NOT PROVIDED')
  console.log('🟠 - clientMeetings prop:', clientMeetings?.length || 0)
  
  // Extract the actual meeting data from the API response structure
  const meetingData = meeting?.data || meeting
  console.log('🟠 - meetingData extracted:', meetingData ? 'EXISTS' : 'NULL')
  console.log('🟠 - meetingData keys:', meetingData ? Object.keys(meetingData) : 'N/A')
  
  const summaryData = meetingData?.summary || {}
  const followUpEmail = meetingData?.followUpEmail || {}
  const socialMedia = meetingData?.socialMediaContent || {}
  const resourcesList = meetingData?.resourcesList || []
  const nextMeetingPrep = meetingData?.nextMeetingPrep || null
  // Handle both camelCase and snake_case, and check for empty strings
  const mindMapRaw = meetingData?.mindMap || meetingData?.mind_map || ""
  const mindMap = mindMapRaw && mindMapRaw.trim() !== "" ? mindMapRaw : null
  
  // DEBUG: Log mindMap data for diagnosis
  console.log('🧠 DEBUG - Mind Map data check:')
  console.log('🧠 - meetingData?.mindMap:', meetingData?.mindMap ? `EXISTS (${meetingData.mindMap.length} chars)` : 'UNDEFINED or NULL')
  console.log('🧠 - meetingData?.mind_map:', meetingData?.mind_map ? `EXISTS (${meetingData.mind_map.length} chars)` : 'UNDEFINED or NULL')
  console.log('🧠 - mindMapRaw:', mindMapRaw ? `EXISTS (${mindMapRaw.length} chars)` : 'EMPTY')
  console.log('🧠 - mindMap variable:', mindMap ? `EXISTS (${mindMap.length} chars)` : 'NULL')
  console.log('🧠 - Will show Mind Map section?', mindMap ? 'YES' : 'NO')
  if (mindMap) {
    console.log('🧠 - Mind Map preview (first 200 chars):', mindMap.substring(0, 200))
  }
  console.log('🧠 - Full meetingData object:', JSON.stringify(meetingData, null, 2).substring(0, 500))
  
  // Recording link fields (defensive: support snake_case and camelCase)
  const initialRec = {
    provider: meetingData?.recording_provider ?? meetingData?.recordingProvider ?? null,
    url: meetingData?.recording_url ?? meetingData?.recordingUrl ?? null,
    access: meetingData?.recording_access ?? meetingData?.recordingAccess ?? null,
    availableAt: meetingData?.recording_available_at ?? meetingData?.recordingAvailableAt ?? null,
  }
  const [rec, setRec] = useState(initialRec)
  const pollingRef = useRef({ attempts: 0, timer: null })
  const meetingId = meetingIdProp || meeting?.meeting_id || meetingData?.meeting_id || null

  // 輪詢錄影連結（最多 5 次，每 60 秒）
  useEffect(() => {
    if (!meetingId || rec.url) return
    const maxAttempts = 5
    const intervalMs = 60000

    const poll = async () => {
      try {
        pollingRef.current.attempts += 1
        const data = await apiService.getMeetingById(meetingId)
        const next = {
          provider: data?.recording_provider ?? data?.recordingProvider ?? null,
          url: data?.recording_url ?? data?.recordingUrl ?? null,
          access: data?.recording_access ?? data?.recordingAccess ?? null,
          availableAt: data?.recording_available_at ?? data?.recordingAvailableAt ?? null,
        }
        if (next.url) {
          setRec(next)
          clearInterval(pollingRef.current.timer)
        } else if (pollingRef.current.attempts >= maxAttempts) {
          clearInterval(pollingRef.current.timer)
        }
      } catch (e) {
        if (pollingRef.current.attempts >= maxAttempts) {
          clearInterval(pollingRef.current.timer)
        }
      }
    }

    // 先嘗試一次，再開始間隔輪詢
    poll()
    pollingRef.current.timer = setInterval(poll, intervalMs)
    return () => {
      if (pollingRef.current.timer) clearInterval(pollingRef.current.timer)
    }
  }, [meetingId, rec.url])
  const [expandedSections, setExpandedSections] = useState({
    summary: false,         // Summary collapsed by default
    painPoint: false,       // Pain point collapsed by default
    goal: false,            // Goal collapsed by default
    suggestion: false,
    actionItems: false,
    coachingAdvice: false,
    followUpEmail: false,
    socialMedia: false,
    resources: false,
    mindMap: false,
    nextMeetingPrep: false
  })

  console.log('🟠 Component props - meeting exists:', !!meeting, 'client exists:', !!client)

  const toggleSection = (section) => {
    // 保存当前滚动位置，防止点击按钮时页面自动跳动
    const scrollPos = window.scrollY || document.documentElement.scrollTop

    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))

    // 使用 requestAnimationFrame 确保在浏览器重绘前恢复滚动位置
    requestAnimationFrame(() => {
      window.scrollTo(0, scrollPos)
    })
  }

  // Copy to clipboard functionality - NO STATE CHANGES
  const copyToClipboard = useCallback(async (text, sectionName, buttonElement) => {
    console.log('🟡 COPY BUTTON CLICKED - Start (no state changes)')
    
    try {
      await navigator.clipboard.writeText(text)
      console.log('🟢 Clipboard write successful')
      showDirectToast(buttonElement)
    } catch (err) {
      console.error('Failed to copy text: ', err)
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea')
        textArea.value = text
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
        console.log('🟢 Fallback copy successful')
        showDirectToast(buttonElement)
      } catch (fallbackErr) {
        console.error('Fallback copy also failed: ', fallbackErr)
      }
    }
    
    console.log('🟡 COPY BUTTON CLICKED - End (no re-renders)')
  }, [])

  // Show toast directly in DOM without React state
  const showDirectToast = (buttonElement) => {
    console.log('🔵 SHOW DIRECT TOAST - Start (no React state)')
    
    // Remove any existing toast
    const existingToast = document.querySelector('.direct-toast')
    if (existingToast) {
      existingToast.remove()
    }
    
    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect()
      console.log('🔵 Button rect:', rect)
      
      // Create toast element directly
      const toast = document.createElement('div')
      toast.className = 'direct-toast'
      toast.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20,6 9,17 4,12"></polyline>
        </svg>
        Copied!
      `
      
      toast.style.cssText = `
        position: fixed;
        left: ${rect.left + rect.width / 2}px;
        top: ${rect.top - 10}px;
        transform: translate(-50%, -100%);
        background-color: #10b981;
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        display: flex;
        align-items: center;
        gap: 6px;
        z-index: 1000;
        font-size: 13px;
        font-weight: 500;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0;
        animation: directToastIn 0.2s ease-out forwards;
      `
      
      document.body.appendChild(toast)
      
      // Remove after 2 seconds
      setTimeout(() => {
        if (toast && toast.parentNode) {
          toast.style.animation = 'directToastOut 0.2s ease-in forwards'
          setTimeout(() => {
            if (toast && toast.parentNode) {
              toast.remove()
            }
          }, 200)
        }
      }, 2000)
    }
    
    console.log('🔵 DIRECT TOAST CREATED - No React re-render!')
  }

  // Modern accordion section component
  const AccordionSection = ({ 
    id, 
    title, 
    icon, 
    children, 
    priority = 'normal',
    defaultExpanded = false,
    copyText = null
  }) => {
    const isExpanded = expandedSections[id] ?? defaultExpanded
    const priorityColors = {
      high: { border: '#e74c3c', bg: '#fff5f5', icon: '#e74c3c' },
      medium: { border: '#f39c12', bg: '#fffbf0', icon: '#f39c12' },
      normal: { border: '#e1e8ed', bg: '#ffffff', icon: '#6c757d' },
      positive: { border: '#27ae60', bg: '#f8fff9', icon: '#27ae60' },
      info: { border: '#3498db', bg: '#f0f9ff', icon: '#3498db' }
    }
    const colors = priorityColors[priority] || priorityColors.normal

    return (
      <div style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        overflow: 'hidden',
        transition: 'all 0.2s ease-in-out',
        boxShadow: isExpanded ? '0 4px 12px rgba(0,0,0,0.1)' : '0 2px 4px rgba(0,0,0,0.05)',
        margin: '0 16px 16px 16px'
      }}>
        <button
          onClick={() => toggleSection(id)}
          className="accordion-header-button"
          style={{
            width: '100%',
            padding: '20px 24px',
            border: 'none',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '16px',
            fontWeight: '600',
            outline: 'none',
            position: 'relative'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ 
              fontSize: '20px', 
              color: colors.icon,
              filter: 'grayscale(0%)'
            }}>
              {icon}
            </span>
            <span style={{ color: '#2c3e50', fontSize: '16px' }}>{title}</span>
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            flexShrink: 0,
            minWidth: copyText ? '56px' : '24px' // Reserve space for copy button + chevron
          }}>
            {copyText && (
              <button
                className="copy-button"
                onClick={(e) => {
                  console.log('🔴 BUTTON CLICK EVENT - Start')
                  console.log('🔴 Event target:', e.target)
                  console.log('🔴 Event currentTarget:', e.currentTarget)
                  console.log('🔴 e.stopPropagation() called')
                  e.stopPropagation()
                  console.log('🔴 e.preventDefault() called')
                  e.preventDefault()
                  console.log('🔴 About to call copyToClipboard')
                  copyToClipboard(copyText, title, e.currentTarget)
                  console.log('🔴 BUTTON CLICK EVENT - End')
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  width: '24px',
                  height: '24px',
                  flexShrink: 0,
                  outline: 'none'
                }}
                title={`Copy ${title}`}
              >
                <svg 
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke={colors.icon} 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                >
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="m5 15-1-1v-10a2 2 0 0 1 2-2h10l-1 1"></path>
                </svg>
              </button>
            )}
            <span style={{ 
              color: colors.icon, 
              fontSize: '18px',
              transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease'
            }}>
              ▼
            </span>
          </div>
        </button>
        
        {isExpanded && (
          <div style={{ 
            padding: '0 24px 24px 24px',
            borderTop: `1px solid ${colors.border}20`,
            animation: 'expandIn 0.2s ease-out'
          }}>
            {children}
          </div>
        )}
      </div>
    )
  }

  if (!meeting) {
    return (
      <div style={{ 
        padding: '40px', 
        textAlign: 'center', 
        color: '#666',
        backgroundColor: '#f8f9fa',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div>
          <h3 style={{ color: '#999', marginBottom: '10px' }}>
            {client ? `${client.name} - Client Overview` : 'Select a meeting to view details'}
          </h3>
          {client && (
            <p style={{ color: '#666' }}>
              Total meetings: {clientMeetings?.length || 0}
            </p>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ 
      padding: '0', 
      height: 'auto',
      backgroundColor: '#fafbfc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* CSS Animation Styles */}
      <style jsx>{`
        @keyframes expandIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Modern Meeting Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '32px 24px',
        color: 'white',
        position: 'sticky',
        top: 0,
        zIndex: 10,
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: '0 0 8px 0', 
          fontSize: '28px',
          fontWeight: '600',
          lineHeight: '1.2'
        }}>
          {summaryData.meetingTitle || 'Meeting Analysis'}
        </h1>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '16px',
          fontSize: '14px',
          opacity: '0.9'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>👤</span>
            <span>{summaryData.clientName || client?.name}</span>
          </div>
          {meetingData.createdAt && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}>
              <span>📅</span>
              <span>{new Date(meetingData.createdAt).toLocaleDateString()}</span>
            </div>
          )}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <span>{meetingData.isDiscovery ? '🔍' : '💼'}</span>
            <span>{meetingData.isDiscovery ? 'Discovery Meeting' : 'Follow-up Meeting'}</span>
          </div>
        </div>
      </div>

      {/* Recording Link Section */}
      <div style={{ padding: '16px 16px 0 16px' }}>
        <AccordionSection
          id="recordingLink"
          title="錄影連結"
          icon="🎥"
          priority="info"
          defaultExpanded={false}
        >
          <div>
            <MeetingRecordingLink
              provider={rec.provider}
              url={rec.url}
              access={rec.access}
              availableAt={rec.availableAt}
              onRetry={async () => {
                if (!meetingId) return
                try {
                  const data = await apiService.getMeetingById(meetingId)
                  const next = {
                    provider: data?.recording_provider ?? data?.recordingProvider ?? null,
                    url: data?.recording_url ?? data?.recordingUrl ?? null,
                    access: data?.recording_access ?? data?.recordingAccess ?? null,
                    availableAt: data?.recording_available_at ?? data?.recordingAvailableAt ?? null,
                  }
                  setRec(next)
                } catch {}
              }}
            />
            <div style={{ marginTop: 8, color: '#6b7280', fontSize: 12 }}>
              系統僅儲存連結與中繼資料，不保存影片檔；如需分享權限，請至 Zoom/Drive 調整。
            </div>
          </div>
        </AccordionSection>
      </div>

      {/* Modern Accordion Content Sections */}
      <div style={{ paddingTop: '24px', paddingBottom: '32px' }}>
        
        {/* Summary */}
        {summaryData.summary && (
          <AccordionSection
            id="summary"
            title="Meeting Summary"
            icon="📝"
            priority="info"
            defaultExpanded={true}
            copyText={summaryData.summary}
          >
            <div style={{ 
              lineHeight: '1.7',
              fontSize: '15px',
              color: '#374151'
            }}>
              {summaryData.summary}
            </div>
          </AccordionSection>
        )}

        {/* Pain Point */}
        {summaryData.painPoint && (
          <AccordionSection
            id="painPoint"
            title="Key Pain Points"
            icon="🎯"
            priority="high"
            defaultExpanded={true}
            copyText={summaryData.painPoint}
          >
            <div style={{ 
              lineHeight: '1.7',
              fontSize: '15px',
              color: '#374151'
            }}>
              {summaryData.painPoint}
            </div>
          </AccordionSection>
        )}

        {/* Goal */}
        {summaryData.goal && (
          <AccordionSection
            id="goal"
            title="Client Goals & Objectives"
            icon="🚀"
            priority="positive"
            defaultExpanded={true}
            copyText={summaryData.goal}
          >
            <div style={{ 
              lineHeight: '1.7',
              fontSize: '15px',
              color: '#374151'
            }}>
              {summaryData.goal}
            </div>
          </AccordionSection>
        )}

        {/* Coach Suggestions */}
        {summaryData.coachSuggestions && summaryData.coachSuggestions.length > 0 && (
          <AccordionSection
            id="suggestion"
            title="Coach Recommendations"
            icon="💡"
            priority="medium"
            defaultExpanded={false}
            copyText={summaryData.coachSuggestions?.join('\n• ')}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {summaryData.coachSuggestions.map((suggestion, index) => (
                <div key={index} style={{
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #f39c12',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  color: '#374151'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <span style={{ color: '#f39c12', marginTop: '2px' }}>→</span>
                    <span>{suggestion.trim()}</span>
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Action Items - Modern Grid Layout */}
        {(summaryData.actionItemsClient?.length > 0 || summaryData.actionItemsCoach?.length > 0) && (
          <AccordionSection
            id="actionItems"
            title="Action Items & Next Steps"
            icon="✅"
            priority="medium"
            defaultExpanded={false}
            copyText={`CLIENT ACTION ITEMS:\n• ${summaryData.actionItemsClient?.join('\n• ') || 'None'}\n\nCOACH ACTION ITEMS:\n• ${summaryData.actionItemsCoach?.join('\n• ') || 'None'}`}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              {summaryData.actionItemsClient && summaryData.actionItemsClient.length > 0 && (
                <div style={{
                  backgroundColor: '#fff8f0',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #fd7e1420'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px'
                  }}>
                    <span style={{ fontSize: '18px' }}>👤</span>
                    <h4 style={{ 
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#fd7e14'
                    }}>Client Action Items</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {summaryData.actionItemsClient.map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '8px 0',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        <span style={{ color: '#fd7e14', fontWeight: 'bold', marginTop: '2px' }}>•</span>
                        <span style={{ color: '#4a5568' }}>{String(item).trim()}</span>
                      </div>
                    ))}
                  </div> 
                </div>
              )}

              {summaryData.actionItemsCoach && summaryData.actionItemsCoach.length > 0 && (
                <div style={{
                  backgroundColor: '#f0f9ff',
                  borderRadius: '12px',
                  padding: '20px',
                  border: '1px solid #17a2b820'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '16px'
                  }}>
                    <span style={{ fontSize: '18px' }}>🎓</span>
                    <h4 style={{ 
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: '600',
                      color: '#17a2b8'
                    }}>Coach Action Items</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {summaryData.actionItemsCoach.map((item, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: '8px',
                        padding: '8px 0',
                        fontSize: '14px',
                        lineHeight: '1.5'
                      }}>
                        <span style={{ color: '#17a2b8', fontWeight: 'bold', marginTop: '2px' }}>•</span>
                        <span style={{ color: '#4a5568' }}>{String(item).trim()}</span>
                      </div>
                    ))}
                  </div> 
                </div>
              )}
            </div>
          </AccordionSection>
        )}

        {/* Coaching Advice */}
        {summaryData.coachingAdvice && summaryData.coachingAdvice.length > 0 && (
          <AccordionSection
            id="coachingAdvice"
            title="Professional Coaching Insights"
            icon="📚"
            priority="info"
            defaultExpanded={false}
            copyText={summaryData.coachingAdvice?.join('\n• ') ? `• ${summaryData.coachingAdvice.join('\n• ')}` : null}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {summaryData.coachingAdvice.map((item, index) => (
                <div key={index} style={{
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #20c997',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  color: '#374151'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <span style={{ color: '#20c997', marginTop: '2px' }}>✓</span>
                    <span>{String(item).trim()}</span>
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Sales Technique Advice */}
        {summaryData.salesTechniqueAdvice && summaryData.salesTechniqueAdvice.length > 0 && (
          <AccordionSection
            id="salesTechniqueAdvice"
            title="Sales Technique Advice"
            icon="💰"
            priority="normal"
            defaultExpanded={false}
            copyText={summaryData.salesTechniqueAdvice?.join('\n• ')}
          >
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '12px'
            }}>
              {summaryData.salesTechniqueAdvice.map((item, index) => (
                <div key={index} style={{
                  backgroundColor: '#f8fafc',
                  padding: '16px',
                  borderRadius: '8px',
                  borderLeft: '4px solid #3498db',
                  fontSize: '15px',
                  lineHeight: '1.6',
                  color: '#374151'
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                  }}>
                    <span style={{ color: '#3498db', marginTop: '2px' }}>→</span>
                    <span>{String(item).trim()}</span>
                  </div>
                </div>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Follow-up Email */}
        {followUpEmail.content && (
          <AccordionSection
            id="followUpEmail"
            title="Follow-up Email"
            icon="📧"
            priority="normal"
            defaultExpanded={false}
            copyText={`Subject: ${followUpEmail.subject}\n\n${followUpEmail.content}`}
          >
            <div style={{
              backgroundColor: '#f8fafc',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ 
                  margin: '0 0 8px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#4a5568'
                }}>Subject:</h4>
                <p style={{ 
                  margin: 0,
                  fontSize: '14px',
                  color: '#2d3748',
                  fontWeight: '500'
                }}>{followUpEmail.subject}</p>
              </div>
              <div>
                <h4 style={{ 
                  margin: '0 0 8px 0',
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#4a5568'
                }}>Content:</h4>
                <div style={{
                  fontSize: '14px',
                  lineHeight: '1.6',
                  color: '#374151',
                  whiteSpace: 'pre-wrap'
                }}>
                  {followUpEmail.content}
                </div>
              </div>
            </div>
          </AccordionSection>
        )}

        {/* Social Media Content */}
        {socialMedia.reels && socialMedia.reels.length > 0 && (
          <AccordionSection
            id="socialMedia"
            title="Social Media Reels Scripts"
            icon="📱"
            priority="normal"
            defaultExpanded={false}
            copyText={socialMedia.reels?.map((reel, index) => 
              `REEL #${index + 1}\nHook: ${reel.hook || ''}\nContent: ${reel.narrative || ''}\nCTA: ${reel.callToAction || ''}\nHashtags: ${reel.hashtags?.map(tag => `#${tag}`).join(' ') || ''}`
            ).join('\n\n---\n\n')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {socialMedia.reels.map((reel, index) => (
                <div key={index} style={{
                  backgroundColor: '#f7fafc',
                  padding: '20px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0'
                }}>
                  <h4 style={{
                    margin: '0 0 12px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2b6cb0'
                  }}>Reel #{index + 1}</h4>
                  
                  {reel.hook && (
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>Hook: </span>
                      <span style={{ color: '#4a5568' }}>{reel.hook}</span>
                    </div>
                  )}
                  
                  {reel.narrative && (
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>Content: </span>
                      <div style={{ color: '#4a5568', marginTop: '4px' }}>{reel.narrative}</div>
                    </div>
                  )}
                  
                  {reel.callToAction && (
                    <div style={{ marginBottom: '12px' }}>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>Call to Action: </span>
                      <span style={{ color: '#4a5568' }}>{reel.callToAction}</span>
                    </div>
                  )}
                  
                  {reel.hashtags && reel.hashtags.length > 0 && (
                    <div>
                      <span style={{ fontWeight: '600', color: '#2d3748' }}>Hashtags: </span>
                      <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {reel.hashtags.map((tag, tagIndex) => (
                          <span key={tagIndex} style={{
                            backgroundColor: '#bee3f8',
                            color: '#2b6cb0',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '12px'
                          }}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Resources List */}
        {resourcesList && resourcesList.length > 0 && (
          <AccordionSection
            id="resources"
            title="Recommended Resources"
            icon="📚"
            priority="normal"
            defaultExpanded={false}
            copyText={resourcesList?.map(resource => 
              `${resource.title}\n${resource.description || ''}\n${resource.url || ''}`
            ).join('\n\n---\n\n')}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {resourcesList.map((resource, index) => (
                <div key={index} style={{
                  backgroundColor: '#f0fff4',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid #c6f6d5'
                }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#2f855a'
                  }}>{resource.title}</h4>
                  
                  {resource.description && (
                    <p style={{
                      margin: '0 0 8px 0',
                      fontSize: '14px',
                      color: '#4a5568',
                      lineHeight: '1.5'
                    }}>{resource.description}</p>
                  )}
                  
                  {resource.url && (
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        color: '#2b6cb0',
                        fontSize: '14px',
                        textDecoration: 'underline'
                      }}
                    >
                      View Resource →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </AccordionSection>
        )}

        {/* Mind Map */}
        {mindMap && (
          <AccordionSection
            id="mindMap"
            title="Mind Map"
            icon="🧠"
            priority="normal"
            defaultExpanded={false}
            copyText={mindMap}
          >
            <MindMapViewer
              mindMapCode={mindMap}
              containerStyle={{
                minHeight: '400px',
                height: '60vh'
              }}
            />
          </AccordionSection>
        )}

        {/* Next Meeting Prep */}
        {nextMeetingPrep && (
          <AccordionSection
            id="nextMeetingPrep"
            title="Next Meeting Preparation"
            icon="📋"
            priority="info"
            defaultExpanded={false}
            copyText={formatNextMeetingPrep(nextMeetingPrep)}
          >
            <div style={{
              backgroundColor: '#f0f9ff',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid #bfdbfe'
            }}>
              <div style={{
                fontSize: '14px',
                lineHeight: '1.6',
                color: '#374151',
                whiteSpace: 'pre-wrap',
                fontFamily: 'monospace'
              }}>
                {formatNextMeetingPrep(nextMeetingPrep)}
              </div>
            </div>
          </AccordionSection>
        )}

      </div>

      {/* No React toast - using direct DOM manipulation */}

      {/* Styles for stable hover effects and direct toast animations */}
      <style jsx global>{`
        .accordion-header-button:hover {
          background-color: rgba(0,0,0,0.02) !important;
          transition: background-color 0.2s ease;
        }
        
        .copy-button:hover {
          background-color: rgba(0,0,0,0.1) !important;
          transition: background-color 0.2s ease;
        }
        
        .copy-button:focus {
          background-color: rgba(0,0,0,0.1) !important;
          outline: none;
        }
        
        @keyframes directToastIn {
          from {
            opacity: 0;
            transform: translate(-50%, -100%) scale(0.8);
          }
          to {
            opacity: 1;
            transform: translate(-50%, -100%) scale(1);
          }
        }
        
        @keyframes directToastOut {
          from {
            opacity: 1;
            transform: translate(-50%, -100%) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(-50%, -100%) scale(0.8);
          }
        }
      `}</style>
    </div>
  )
}
