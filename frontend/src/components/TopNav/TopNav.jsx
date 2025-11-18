import React, { useRef } from 'react'

const tabs = [
  { key: null, label: '🏠 Dashboard' },
  { key: 'Clients', label: '👥 Clients' },
  { key: 'Reels', label: '🎬 Reels' },
  { key: 'Settings', label: '⚙️ Settings' },
]

export default function TopNav({
  activeTab,
  onChange,
  isAuthenticated,
  currentUser,
  onLogout,
  // Single client view props
  clientViewMode,
  selectedClient,
  selectedMeeting,
  onBackToAllClients,
  onMeetingSelect,
  // Client details view props
  showClientDetails,
  selectedClientForDetails,
  onCloseClientDetails,
  clientMeetings,
  onScrollToMeeting
}) {
  // 測試穩定化：避免 Reels 連點競態（單一 ref，不在迴圈中宣告 hooks）
  const lastReelsClickRef = useRef(0)

  return (
    <div 
      data-testid="topnav-ready" 
      className="topnav-sidebar"
      style={{
        flexShrink: 0,
        width: '300px',
        minWidth: '250px',
        maxWidth: '300px',
        background: '#fff',
        borderRight: '1px solid #e9ecef',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
        height: '100%',
        overflowY: 'auto'
      }}
    >
      {showClientDetails && selectedClientForDetails && activeTab === 'Clients' ? (
        // Client Details Navigation
        <div style={{ padding: '0 20px' }}>
          {/* Back to Clients Button */}
          <button
            onClick={onCloseClientDetails}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '400',
              marginBottom: '20px',
              width: '100%',
              transition: 'background-color 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#5a6268'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#6c757d'
            }}
          >
            ← Back to Clients
          </button>

          {/* Client Header */}
          <div>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '600',
              color: '#111827',
              marginBottom: '8px'
            }}>
              {selectedClientForDetails.name}
            </h2>
            <p style={{
              color: '#6b7280',
              fontSize: '13px',
              marginBottom: '20px'
            }}>
              Client Details • {clientMeetings?.length || 0} meetings
            </p>

            {/* Meeting Navigation Buttons */}
            {clientMeetings && clientMeetings.length > 0 && (
              <div>
                <h3 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '12px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}>
                  Meetings
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {clientMeetings.map((meeting, index) => (
                    <button
                      key={meeting.meeting_id}
                      onClick={() => onScrollToMeeting && onScrollToMeeting(meeting.meeting_id)}
                      style={{
                        padding: '12px 16px',
                        background: '#f8f9fa',
                        color: '#374151',
                        border: '1px solid #e9ecef',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '13px',
                        textAlign: 'left',
                        transition: 'all 0.2s ease',
                        width: '100%'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#e9ecef'
                        e.target.style.borderColor = '#007bff'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#f8f9fa'
                        e.target.style.borderColor = '#e9ecef'
                      }}
                    >
                      <div style={{ fontWeight: '500', marginBottom: '4px' }}>
                        {meeting.meeting_title || `Meeting ${index + 1}`}
                      </div>
                      <div style={{
                        fontSize: '11px',
                        opacity: 0.8
                      }}>
                        {meeting.created_at ? new Date(meeting.created_at).toLocaleDateString() : 'No date'} • {meeting.analysis_status || 'Unknown'}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : clientViewMode === 'single-client' && activeTab === 'Clients' ? (
        // Single Client Navigation
        <div style={{ padding: '0 20px' }}>
          {/* Back to All Clients Button */}
          <button
            onClick={onBackToAllClients}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              background: 'transparent',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px',
              color: '#374151',
              marginBottom: '20px',
              width: '100%'
            }}
          >
            ← All Clients
          </button>

          {/* Client Header */}
          {selectedClient && (
            <div>
              <h2 style={{
                fontSize: '20px',
                fontWeight: '600',
                color: '#111827',
                marginBottom: '8px'
              }}>
                {selectedClient.name}
              </h2>
              <p style={{
                color: '#6b7280',
                fontSize: '13px',
                marginBottom: '20px'
              }}>
                {selectedClient.email} • {clientMeetings?.length || 0} meetings
              </p>

              {/* Meeting Buttons - Only show when NOT in single meeting view */}
              {clientViewMode !== 'single-client' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {clientMeetings?.map(meeting => (
                  <button
                    key={meeting.meeting_id}
                    onClick={() => onMeetingSelect && onMeetingSelect(meeting)}
                    style={{
                      padding: '12px 16px',
                      background: selectedMeeting?.meeting_id === meeting.meeting_id ? '#007bff' : '#f8f9fa',
                      color: selectedMeeting?.meeting_id === meeting.meeting_id ? 'white' : '#374151',
                      border: selectedMeeting?.meeting_id === meeting.meeting_id ? '1px solid #007bff' : '1px solid #e9ecef',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      textAlign: 'left',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ fontWeight: '500' }}>
                      {meeting.meeting_title || 'Meeting'}
                    </div>
                    <div style={{ 
                      fontSize: '11px', 
                      opacity: 0.8,
                      marginTop: '4px'
                    }}>
                      {meeting.meeting_date ? new Date(meeting.meeting_date).toLocaleDateString() : 'No date'}
                    </div>
                  </button>
                ))}
              </div>
              )}
            </div>
          )}
        </div>
      ) : (
        // Main Navigation Tabs
        <div>
          {tabs.map(t => {
            const testId = t.key === null
              ? 'nav-dashboard'
              : t.key === 'Clients'
                ? 'nav-clients'
                : t.key === 'Reels'
                  ? 'nav-reels'
                  : t.key === 'Settings'
                    ? 'nav-settings'
                    : undefined
            return (
            <div key={t.key}>
              <button
                data-testid={testId}
                onClick={() => {
                  if (t.key === 'Reels') {
                    const now = Date.now()
                    if (now - lastReelsClickRef.current < 250) return
                    lastReelsClickRef.current = now
                  }
                  onChange(t.key)
                }}
                style={{
                  padding: '12px 20px',
                  borderRadius: 0,
                  background: activeTab === t.key ? '#007bff' : 'transparent',
                  color: activeTab === t.key ? '#fff' : '#222',
                  border: 'none',
                  borderLeft: activeTab === t.key ? '4px solid #0056b3' : '4px solid transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  fontSize: '14px',
                  fontWeight: activeTab === t.key ? '600' : '400',
                  transition: 'all 0.2s ease',
                  margin: '2px 0',
                  width: '100%'
                }}
              >
                {t.label}
              </button>

              {/* Show client details sub-nav when Clients is active and client details is shown */}
              {t.key === 'Clients' && activeTab === 'Clients' && showClientDetails && selectedClientForDetails && (
                <div style={{
                  marginLeft: '20px',
                  borderLeft: '2px solid #e5e7eb',
                  paddingLeft: '16px',
                  margin: '8px 0 8px 20px'
                }}>
                  <button
                    onClick={onCloseClientDetails}
                    style={{
                      padding: '8px 16px',
                      background: '#f8f9fa',
                      color: '#007bff',
                      border: '1px solid #007bff',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: '500',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    📄 {selectedClientForDetails.name}
                  </button>
                </div>
              )}
            </div>
          )})}
        </div>
      )}
      
      {/* Authentication Status and Logout */}
      <div style={{ marginTop: 'auto', padding: '20px' }}>
        {isAuthenticated && currentUser ? (
          <div>
            <div style={{
              fontSize: '12px',
              color: '#666',
              marginBottom: '10px',
              padding: '8px',
              background: '#f8f9fa',
              borderRadius: '4px'
            }}>
              Signed in as:<br />
              <strong>{currentUser.email}</strong>
            </div>
            <button
              onClick={onLogout}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #dc3545',
                background: 'transparent',
                color: '#dc3545',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.target.style.background = '#dc3545'
                e.target.style.color = 'white'
              }}
              onMouseOut={(e) => {
                e.target.style.background = 'transparent'
                e.target.style.color = '#dc3545'
              }}
            >
              Sign Out
            </button>
          </div>
        ) : (
          <div style={{
            fontSize: '12px',
            color: '#999',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            Not signed in
          </div>
        )}
      </div>
    </div>
  )
}
