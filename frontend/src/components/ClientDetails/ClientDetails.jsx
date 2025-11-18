import React, { useState, useEffect, useMemo } from 'react'
import { apiService } from '../../services/api'

// Add CSS animations and modern styling
const cssStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }

  @keyframes fadeInUp {
    0% {
      opacity: 0;
      transform: translateY(20px);
    }
    100% {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .client-detail-card {
    animation: fadeInUp 0.6s ease-out;
  }

  .client-detail-card:nth-child(1) { animation-delay: 0.1s; }
  .client-detail-card:nth-child(2) { animation-delay: 0.2s; }
  .client-detail-card:nth-child(3) { animation-delay: 0.3s; }
  .client-detail-card:nth-child(4) { animation-delay: 0.4s; }
  .client-detail-card:nth-child(5) { animation-delay: 0.5s; }

  .meeting-header:hover {
    background-color: #f8fafc !important;
    transform: translateY(-1px);
  }

  .info-item:last-child {
    border-bottom: none !important;
  }
`

// Inject styles
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style')
  styleSheet.textContent = cssStyles
  if (!document.head.querySelector('style[data-client-details]')) {
    styleSheet.setAttribute('data-client-details', 'true')
    document.head.appendChild(styleSheet)
  }
}

export default function ClientDetails({ clientId, onClose, onMeetingsLoaded, onMeetingClick, client: clientProp }) {
  const [client, setClient] = useState(null)
  const [meetings, setMeetings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [visibleColumns, setVisibleColumns] = useState({})
  const [expandedMeetings, setExpandedMeetings] = useState({})
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  useEffect(() => {
    if (window.highlightMeetingId) {
      const element = document.getElementById(`meeting-${window.highlightMeetingId}`);
      if (element) {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
        // Also expand the meeting details
        setExpandedMeetings(prev => ({
          ...prev,
          [window.highlightMeetingId]: true
        }));
      }
      // Clear the highlightMeetingId after scrolling
      window.highlightMeetingId = null;
    }
  }, [meetings]);

  // Load client details and meetings
  const loadClientData = async () => {
    try {
      setIsLoading(true)

      // Load user column preferences first
      if (apiService.isAuthenticated()) {
        try {
          const savedColumns = await apiService.getUserColumnPreferences()
          if (savedColumns && savedColumns.length > 0) {
            const columnPrefs = {}
            savedColumns.forEach(col => {
              columnPrefs[col] = true
            })
            setVisibleColumns(columnPrefs)
          }
        } catch (error) {
          console.warn('Failed to load column preferences:', error)
        }
      }

      // Load client data and meetings in parallel
      const [clientsResponse, meetingsResponse] = await Promise.all([
        apiService.listClients(),
        apiService.listMeetings()
      ])

      // Handle clients response structure
      let clientsData = []
      if (clientsResponse && clientsResponse.success && Array.isArray(clientsResponse.data)) {
        clientsData = clientsResponse.data
      } else if (Array.isArray(clientsResponse)) {
        clientsData = clientsResponse
      }

      // Find the specific client
      const targetClient = clientsData.find(c => c.client_id === clientId)
      if (!targetClient) {
        setError('Client not found')
        return
      }

      // Handle meetings response and filter for this client
      const meetingsData = Array.isArray(meetingsResponse) ? meetingsResponse : []
      const clientMeetings = meetingsData.filter(m => m.client_id === clientId)
      const enhancedMeetings = clientMeetings.map(enhanceMeetingDetails)

      setClient(targetClient)
      setMeetings(enhancedMeetings)

      // Pass meetings data back to parent for navigation
      if (onMeetingsLoaded) {
        onMeetingsLoaded(enhancedMeetings)
      }
    } catch (error) {
      console.error('Error loading client data:', error)
      setError('Failed to load client data')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadClientData()
  }, [clientId])

  // Toggle meeting expansion
  const toggleMeetingExpansion = (meetingId) => {
    setExpandedMeetings(prev => ({
      ...prev,
      [meetingId]: !prev[meetingId]
    }))
  }

  // Handle save client
  const handleSaveClient = async (updatedClient) => {
    try {
      console.log('💾 Saving client changes:', updatedClient)
      
      // Call API to update client
      const updatedClientData = await apiService.updateClient(clientId, updatedClient)
      
      if (updatedClientData) {
        console.log('✅ Client updated successfully:', updatedClientData)
        
        // Optimistically update the client state immediately for better UX
        setClient(prevClient => ({
          ...prevClient,
          ...updatedClientData
        }))
        
        // Reload client data from server to ensure consistency
        // This will refresh both client info and meetings list
        await loadClientData()
        
        // Close modal after successful save
        setIsEditModalOpen(false)
      } else {
        throw new Error('No data returned from update API')
      }
    } catch (error) {
      console.error('❌ Error saving client:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      alert(`Failed to save client changes: ${errorMessage}. Please try again.`)
    }
  }

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  // Format datetime helper
  const formatDateTime = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleString()
  }

  if (isLoading) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: '#fafbfc',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e2e8f0',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <div style={{
            color: '#64748b',
            fontSize: '16px',
            fontWeight: '500'
          }}>
            Loading client details...
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{
        padding: '48px 24px',
        textAlign: 'center',
        backgroundColor: '#fafbfc',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          padding: '40px 32px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          maxWidth: '400px'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            ⚠️
          </div>
          <div style={{
            color: '#dc2626',
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '8px'
          }}>
            Error Loading Client
          </div>
          <div style={{
            color: '#64748b',
            fontSize: '14px',
            marginBottom: '24px'
          }}>
            {error}
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '12px 24px',
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            ← Back to Clients
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
    <div style={{
      padding: '32px',
      width: '100%',
      minWidth: '100%',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'visible'
    }}>
      {/* Header with clean styling */}
      <div style={{
        marginBottom: '40px',
        paddingBottom: '20px',
        borderBottom: '1px solid #e5e7eb'
      }}>
        <h1 style={{
          margin: '0 0 8px 0',
          fontSize: '36px',
          fontWeight: '700',
          color: '#111827',
          letterSpacing: '-0.025em'
        }}>
          {client.name}
        </h1>
        <p style={{
          margin: 0,
          fontSize: '18px',
          color: '#6b7280',
          fontWeight: '400'
        }}>
          Client Profile
        </p>
        <button onClick={() => setIsEditModalOpen(true)}>Edit Client</button>
      </div>

      {/* Client Overview Card - Modern 2025 Design */}
      <div style={{
        ...cardStyle,
        marginBottom: '40px',
        padding: '32px',
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
      }}>
        {/* Primary Information Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          marginBottom: '24px',
          paddingBottom: '24px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CLIENT NAME</span>
            <span style={{ fontSize: '18px', fontWeight: '700', color: '#111827' }}>{client.name}</span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>EMAIL</span>
            <span style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>{client.email || 'Not provided'}</span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>STATUS</span>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: '16px',
              fontWeight: '600',
              color: '#059669',
              gap: '8px'
            }}>
              <span style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10b981'
              }}></span>
              Active
            </span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SOURCE</span>
            <span style={{ fontSize: '16px', fontWeight: '500', color: '#374151' }}>{client.source || 'Not specified'}</span>
          </div>
        </div>

        {/* Session Statistics Row */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: '20px'
        }}>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>SESSIONS</span>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#3b82f6' }}>{meetings.length}</span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>TOTAL SESSIONS</span>
            <span style={{ fontSize: '24px', fontWeight: '700', color: '#10b981' }}>{meetings.length}</span>
          </div>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '16px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LAST SESSION</span>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
              {meetings.length > 0
                ? formatDate(Math.max(...meetings.map(m => new Date(m.created_at))))
                : 'No sessions yet'
              }
            </span>
          </div>

          {visibleColumns['Start Date'] && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '16px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>START DATE</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{formatDate(client.start_date)}</span>
            </div>
          )}

          {visibleColumns['Contact Information'] && client.address && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '16px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>ADDRESS</span>
              <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>{client.address}</span>
            </div>
          )}

          {visibleColumns['Contract Status'] && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '16px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CONTRACT</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{client.contract_status || 'Not set'}</span>
            </div>
          )}

          {visibleColumns['Invoice Status'] && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '16px',
              backgroundColor: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>INVOICE</span>
              <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>{client.invoice_status || 'Not set'}</span>
            </div>
          )}
        </div>
      </div>

      {/* Info Section with enhanced styling */}
      {visibleColumns['Info'] && client.info && (
        <div style={{ ...cardStyle, marginBottom: '32px' }}>
          <h3 style={cardHeaderStyle}>
            📝 Information
          </h3>
          <div style={{
            fontSize: '15px',
            lineHeight: '1.7',
            color: '#374151',
            whiteSpace: 'pre-line',
            backgroundColor: '#f8fafc',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #e2e8f0'
          }}>
            {client.info}
          </div>
        </div>
      )}

      {/* Notes Section with enhanced styling */}
      {visibleColumns['Notes'] && client.notes && (
        <div style={{ ...cardStyle, marginBottom: '32px' }}>
          <h3 style={cardHeaderStyle}>
            📝 Notes
          </h3>
          <div style={{
            fontSize: '15px',
            lineHeight: '1.7',
            color: '#374151',
            whiteSpace: 'pre-line',
            backgroundColor: '#fffbeb',
            padding: '20px',
            borderRadius: '8px',
            border: '1px solid #fcd34d',
            borderLeft: '4px solid #f59e0b'
          }}>
            {client.notes}
          </div>
        </div>
      )}

      {/* Tags Section with modern tag design */}
      {visibleColumns['Tags'] && client.tags && client.tags.length > 0 && (
        <div style={{ ...cardStyle, marginBottom: '32px' }}>
          <h3 style={cardHeaderStyle}>
            🏷️ Tags
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
            {client.tags.map((tag, index) => (
              <span
                key={index}
                style={{
                  fontSize: '13px',
                  padding: '8px 16px',
                  backgroundColor: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #93c5fd',
                  borderRadius: '20px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  cursor: 'default'
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Meetings Section Header */}
      <h3 style={{
        fontSize: '20px',
        fontWeight: '700',
        color: '#0f172a',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      }}>
        📅 Meetings {meetings.length}
      </h3>

      {/* Meetings List */}
      {meetings.length === 0 ? (
        <div style={{
          ...cardStyle,
          textAlign: 'center',
          padding: '48px 24px',
          color: '#64748b',
          fontSize: '16px',
          backgroundColor: '#f8fafc',
          border: '2px dashed #e2e8f0'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '16px'
          }}>
            📅
          </div>
          <div style={{ fontWeight: '600', marginBottom: '8px' }}>
            No meetings found
          </div>
          <div style={{ fontSize: '14px', color: '#94a3b8' }}>
            This client hasn't had any meetings yet
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%', maxWidth: '100%', minWidth: 0 }}>
            {meetings.map((meeting) => {
              const followUpEmail = meeting.parsedFollowUpEmail;
              const resourcesList = meeting.parsedResourcesList || [];
              return (
              <div
                key={meeting.meeting_id}
                id={`meeting-${meeting.meeting_id}`}
                style={{
                  ...cardStyle,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  scrollMarginTop: '20px',
                  width: '100%',
                  maxWidth: '100%',
                  minWidth: 0,
                  padding: 0,
                  boxShadow: expandedMeetings[meeting.meeting_id]
                    ? '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    : '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                  transition: 'all 0.2s ease-in-out',
                  marginBottom: '20px'
                }}
              >
                {/* Meeting Header with modern design */}
                <div
                  onClick={() => toggleMeetingExpansion(meeting.meeting_id)}
                  style={{
                    padding: expandedMeetings[meeting.meeting_id] ? '16px 50px 16px 20px' : '20px 50px 20px 24px',
                    backgroundColor: expandedMeetings[meeting.meeting_id] ? '#f8fafc' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderBottom: expandedMeetings[meeting.meeting_id] ? '1px solid #e2e8f0' : 'none',
                    transition: 'all 0.2s ease-in-out',
                    borderRadius: expandedMeetings[meeting.meeting_id] ? '8px 8px 0 0' : '8px',
                    minHeight: expandedMeetings[meeting.meeting_id] ? 'auto' : '80px',
                    width: '100%',
                    maxWidth: '100%',
                    minWidth: 0,
                    overflow: 'visible',
                    position: 'relative',
                    ':hover': {
                      backgroundColor: '#f8fafc'
                    }
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: expandedMeetings[meeting.meeting_id] ? '6px' : '8px'
                    }}>
                      <div style={{
                        fontWeight: '600',
                        color: '#0f172a',
                        fontSize: '16px'
                      }}>
                        {meeting.meeting_title || 'Untitled Meeting'}
                      </div>
                      {onMeetingClick && (clientProp || client) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation() // Prevent expanding/collapsing when clicking the button
                            onMeetingClick(clientProp || client, meeting)
                          }}
                          style={{
                            padding: '4px 12px',
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#3b82f6',
                            backgroundColor: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#dbeafe'
                            e.target.style.borderColor = '#93c5fd'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#eff6ff'
                            e.target.style.borderColor = '#bfdbfe'
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          View Details
                        </button>
                      )}
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      fontSize: expandedMeetings[meeting.meeting_id] ? '13px' : '14px',
                      color: '#64748b'
                    }}>
                      <span>{formatDateTime(meeting.created_at)}</span>
                    </div>
                  </div>
                  <div style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: `translateY(-50%) ${expandedMeetings[meeting.meeting_id] ? 'rotate(180deg)' : 'rotate(0deg)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: expandedMeetings[meeting.meeting_id] ? '32px' : '36px',
                    height: expandedMeetings[meeting.meeting_id] ? '32px' : '36px',
                    borderRadius: '50%',
                    backgroundColor: '#f1f5f9',
                    transition: 'all 0.2s ease',
                    zIndex: 1
                  }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ color: '#64748b' }}>
                      <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                </div>

                {/* Meeting Details with vertical sections */}
                {expandedMeetings[meeting.meeting_id] && (
                  <div style={{
                    padding: '24px 20px',
                    backgroundColor: '#ffffff',
                    borderRadius: '0 0 8px 8px',
                    maxWidth: '100%',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '24px',
                      maxWidth: '100%',
                      wordWrap: 'break-word'
                    }}>
                      {meeting.summary && (
                        <div style={{
                          borderBottom: '1px solid #f1f5f9',
                          paddingBottom: '20px'
                        }}>
                          <h4 style={{
                            margin: '0 0 12px 0',
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#0f172a',
                            display: 'flex',
                            alignItems: 'center'
                          }}>
                            📝 Summary
                          </h4>
                          <div style={{
                            fontSize: '15px',
                            color: '#374151',
                            lineHeight: '1.6',
                            backgroundColor: '#f8fafc',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            maxWidth: '100%',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'
                          }}>
                            {meeting.summary}
                          </div>
                        </div>
                      )}

                      {meeting.pain_point && (
                        <div style={{
                          borderBottom: '1px solid #f1f5f9',
                          paddingBottom: '20px'
                        }}>
                          <h4 style={{ 
                            margin: '0 0 12px 0', 
                            fontSize: '16px', 
                            fontWeight: '700',
                            color: '#0f172a'
                          }}>
                            🎯 Pain Point
                          </h4>
                          <div style={{ 
                            fontSize: '15px', 
                            color: '#374151', 
                            lineHeight: '1.6',
                            backgroundColor: '#f8fafc',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            maxWidth: '100%',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'
                          }}>
                            {meeting.pain_point}
                          </div>
                        </div>
                      )}

                      {meeting.goal && (
                        <div style={{
                          borderBottom: '1px solid #f1f5f9',
                          paddingBottom: '20px'
                        }}>
                          <h4 style={{ 
                            margin: '0 0 12px 0', 
                            fontSize: '16px', 
                            fontWeight: '700',
                            color: '#0f172a'
                          }}>
                            🎯 Goal
                          </h4>
                          <div style={{ 
                            fontSize: '15px', 
                            color: '#374151', 
                            lineHeight: '1.6',
                            backgroundColor: '#f8fafc',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            maxWidth: '100%',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'
                          }}>
                            {meeting.goal}
                          </div>
                        </div>
                      )}

                      {meeting.suggestion && (
                        <div style={{
                          borderBottom: '1px solid #f1f5f9',
                          paddingBottom: '20px'
                        }}>
                          <h4 style={{ 
                            margin: '0 0 12px 0', 
                            fontSize: '16px', 
                            fontWeight: '700',
                            color: '#0f172a'
                          }}>
                            💡 Suggestions
                          </h4>
                          <div style={{ 
                            fontSize: '15px', 
                            color: '#374151', 
                            lineHeight: '1.6',
                            backgroundColor: '#f8fafc',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            maxWidth: '100%',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'
                          }}>
                            {meeting.suggestion}
                          </div>
                        </div>
                      )}

                      {meeting.action_items_client && (
                        <div style={{
                          borderBottom: '1px solid #f1f5f9',
                          paddingBottom: '20px'
                        }}>
                          <h4 style={{ 
                            margin: '0 0 12px 0', 
                            fontSize: '16px', 
                            fontWeight: '700',
                            color: '#0f172a'
                          }}>
                            ✅ Client Action Items
                          </h4>
                          <div style={{ 
                            fontSize: '15px', 
                            color: '#374151', 
                            lineHeight: '1.6',
                            backgroundColor: '#f8fafc',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            maxWidth: '100%',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'
                          }}>
                            {meeting.action_items_client}
                          </div>
                        </div>
                      )}

                      {meeting.action_items_coach && (
                        <div>
                          <h4 style={{ 
                            margin: '0 0 12px 0', 
                            fontSize: '16px', 
                            fontWeight: '700',
                            color: '#0f172a'
                          }}>
                            ✅ Coach Action Items
                          </h4>
                          <div style={{ 
                            fontSize: '15px', 
                            color: '#374151', 
                            lineHeight: '1.6',
                            backgroundColor: '#f8fafc',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            maxWidth: '100%',
                            wordWrap: 'break-word',
                            overflowWrap: 'break-word'
                          }}>
                            {meeting.action_items_coach}
                          </div>
                        </div>
                      )}

                      {followUpEmail && (
                        <div style={{
                          borderBottom: '1px solid #f1f5f9',
                          paddingBottom: '20px'
                        }}>
                          <h4 style={{
                            margin: '0 0 12px 0',
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#0f172a'
                          }}>
                            Follow-up Email
                          </h4>
                          {followUpEmail.subject && (
                            <div style={{
                              marginBottom: '12px',
                              fontSize: '14px',
                              color: '#374151'
                            }}>
                              <span style={{ fontWeight: '600' }}>Subject:</span> {followUpEmail.subject}
                            </div>
                          )}
                          <div style={{
                            fontSize: '14px',
                            color: '#374151',
                            lineHeight: '1.6',
                            backgroundColor: '#f8fafc',
                            padding: '16px',
                            borderRadius: '8px',
                            border: '1px solid #e2e8f0',
                            whiteSpace: 'pre-wrap'
                          }}>
                            {followUpEmail.content}
                          </div>
                        </div>
                      )}

                      {resourcesList.length > 0 && (
                        <div style={{
                          borderBottom: '1px solid #f1f5f9',
                          paddingBottom: '20px'
                        }}>
                          <h4 style={{
                            margin: '0 0 12px 0',
                            fontSize: '16px',
                            fontWeight: '700',
                            color: '#0f172a'
                          }}>
                            Recommended Resources
                          </h4>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}>
                            {resourcesList.map((resource, index) => (
                              <div
                                key={index}
                                style={{
                                  backgroundColor: '#f8fafc',
                                  padding: '16px',
                                  borderRadius: '8px',
                                  border: '1px solid #e2e8f0'
                                }}
                              >
                                <div style={{
                                  fontSize: '15px',
                                  fontWeight: '600',
                                  color: '#1f2937',
                                  marginBottom: resource.description ? '8px' : '0'
                                }}>
                                  {resource.title ? resource.title : 'Resource ' + (index + 1)}
                                </div>
                                {resource.description && (
                                  <div style={{
                                    fontSize: '14px',
                                    color: '#4a5568',
                                    lineHeight: '1.6',
                                    marginBottom: resource.url ? '8px' : '0'
                                  }}>
                                    {resource.description}
                                  </div>
                                )}
                                {resource.url && (
                                  <a
                                    href={resource.url}
                                    target='_blank'
                                    rel='noreferrer'
                                    style={{
                                      fontSize: '13px',
                                      color: '#2563eb',
                                      textDecoration: 'none'
                                    }}
                                  >
                                    {resource.url}
                                  </a>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
            })}
        </div>
      )}
    </div>
    <EditClientModal
      client={client}
      isOpen={isEditModalOpen}
      onClose={() => setIsEditModalOpen(false)}
      onSave={handleSaveClient}
    />
    </>
  )
}

function EditClientModal({ client, isOpen, onClose, onSave }) {
  const [name, setName] = useState(client?.name || '');
  const [email, setEmail] = useState(client?.email || '');
  const [status, setStatus] = useState(client?.status || 'Active');
  const [notes, setNotes] = useState(client?.notes || '');

  useEffect(() => {
    if (client) {
      setName(client.name || '');
      setEmail(client.email || '');
      setStatus(client.status || 'Active');
      setNotes(client.notes || '');
    }
  }, [client]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave({
      name,
      email,
      status,
      notes,
    });
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleOverlayClick}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'white',
          padding: '32px',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
        }}
      >
        <h2 style={{ 
          margin: '0 0 24px 0', 
          fontSize: '24px', 
          fontWeight: '700',
          color: '#111827'
        }}>
          Edit Client
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              Client Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#111827',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#10b981';
                e.target.style.outline = 'none';
                e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Enter client name..."
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#111827',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#10b981';
                e.target.style.outline = 'none';
                e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Enter email address..."
            />
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#111827',
                backgroundColor: '#ffffff',
                boxSizing: 'border-box',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#10b981';
                e.target.style.outline = 'none';
                e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
              <option value="Prospect">Prospect</option>
              <option value="Lead">Lead</option>
              <option value="Paused">Paused</option>
              <option value="Archived">Archived</option>
            </select>
          </div>

          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                color: '#111827',
                backgroundColor: '#ffffff',
                minHeight: '120px',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#10b981';
                e.target.style.outline = 'none';
                e.target.style.boxShadow = '0 0 0 3px rgba(16, 185, 129, 0.1)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#d1d5db';
                e.target.style.boxShadow = 'none';
              }}
              placeholder="Enter notes about this client..."
            />
          </div>
        </div>

        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end',
          marginTop: '24px',
          paddingTop: '24px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              border: '2px solid #e5e7eb',
              background: 'white',
              color: '#374151',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.backgroundColor = '#f9fafb';
            }}
            onMouseLeave={(e) => {
              e.target.style.borderColor = '#e5e7eb';
              e.target.style.backgroundColor = 'white';
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 24px',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              minWidth: '100px'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = 'none';
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function for modern status colors with enhanced visual hierarchy
function getStatusColor(status) {
  const colors = {
    'Active': {
      bg: '#ecfdf5',
      text: '#059669',
      border: '#a7f3d0',
      dot: '#10b981'
    },
    'Inactive': {
      bg: '#f9fafb',
      text: '#6b7280',
      border: '#d1d5db',
      dot: '#9ca3af'
    },
    'Prospect': {
      bg: '#eff6ff',
      text: '#2563eb',
      border: '#93c5fd',
      dot: '#3b82f6'
    },
    'Lead': {
      bg: '#fffbeb',
      text: '#d97706',
      border: '#fcd34d',
      dot: '#f59e0b'
    },
    'Paused': {
      bg: '#fef2f2',
      text: '#dc2626',
      border: '#fca5a5',
      dot: '#ef4444'
    },
    'Archived': {
      bg: '#f8fafc',
      text: '#475569',
      border: '#cbd5e1',
      dot: '#64748b'
    }
  }
  return colors[status] || colors['Active']
}

// Helper function for analysis status colors
function getAnalysisStatusColor(status) {
  const colors = {
    'completed': {
      bg: '#ecfdf5',
      text: '#059669'
    },
    'processing': {
      bg: '#fef3c7',
      text: '#d97706'
    },
    'pending': {
      bg: '#e0e7ff',
      text: '#4338ca'
    },
    'failed': {
      bg: '#fef2f2',
      text: '#dc2626'
    }
  }
  return colors[status.toLowerCase()] || { bg: '#f3f4f6', text: '#6b7280' }
}

function enhanceMeetingDetails(meeting) {
  if (!meeting) {
    return meeting;
  }

  return {
    ...meeting,
    parsedFollowUpEmail: parseFollowUpEmailContent(meeting),
    parsedResourcesList: parseResourcesListContent(meeting)
  };
}

function parseFollowUpEmailContent(meeting) {
  const raw = meeting?.email_content;
  if (!raw || raw === 'null' || raw === '{}') {
    return null;
  }

  let subject = meeting?.meeting_title ? 'Follow-up: ' + meeting.meeting_title : 'Follow-up';
  let content = '';

  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      subject = parsed.subject || subject;
      content = parsed.body || parsed.content || '';
    }
  } catch (error) {
    content = raw;
  }

  if (!content || !content.toString().trim()) {
    return null;
  }

  return {
    subject,
    content: content.toString().trim()
  };
}

function parseResourcesListContent(meeting) {
  const raw = meeting?.resources_list;
  if (!raw || raw === 'null' || raw === '[]') {
    return [];
  }

  const normaliseItems = (items) => {
    if (!Array.isArray(items)) {
      return [];
    }

    return items
      .map((item) => {
        if (!item) {
          return null;
        }

        if (typeof item === 'string') {
          return {
            title: '',
            description: item,
            url: ''
          };
        }

        return {
          title: item.title || '',
          description: item.description || '',
          url: item.url || ''
        };
      })
      .filter((item) => item && (item.title || item.description || item.url));
  };

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return normaliseItems(parsed);
    }

    if (parsed && typeof parsed === 'object') {
      if (Array.isArray(parsed.resources)) {
        return normaliseItems(parsed.resources);
      }

      if (Array.isArray(parsed.resourcesList)) {
        return normaliseItems(parsed.resourcesList);
      }
    }
  } catch (error) {
    // Ignore malformed JSON; nothing to render.
  }

  return [];
}
// Clean card styles matching the design
const cardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  padding: '24px',
  boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  transition: 'all 0.2s ease-in-out'
}

const cardHeaderStyle = {
  margin: '0 0 20px 0',
  fontSize: '18px',
  fontWeight: '700',
  color: '#111827',
  letterSpacing: '-0.025em',
  display: 'flex',
  alignItems: 'center',
  paddingBottom: '12px',
  borderBottom: '1px solid #e5e7eb'
}

const infoGridStyle = {
  display: 'flex',
  flexDirection: 'column',
  gap: '16px'
}

const infoItemStyle = {
  display: 'flex',
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 0',
  borderBottom: '1px solid #f3f4f6'
}


