import React, { useState, useMemo, useEffect, useRef } from 'react'
import { apiService } from '../../services/api'

export default function ClientsTable({ 
  rows, 
  isLoading, 
  meetings = [],
  onClientClick,
  onToggleFavorite,
  onEdit,
  onDelete
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [hoveredRowId, setHoveredRowId] = useState(null)
  const [showColumnDropdown, setShowColumnDropdown] = useState(false)
  const [editingRowId, setEditingRowId] = useState(null)
  const [editingData, setEditingData] = useState({})
  const [originalData, setOriginalData] = useState({})
  const dropdownRef = useRef(null)

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState({
    // Core Client Information - default visible
    'Client Name': true,
    'Info': true,
    'Session Counts': true,
    'Total Sessions': true,
    'Status': true,
    'Contact Information': false,
    'Source': false,
    'Lead Status': false,
    'Engagement Type': false,
    'Program': false,
    'Start Date': false,
    'End Date': false,
    'Notes': false,
    'Tags': false,
    // Administrative - default hidden
    'Contract Status': false,
    'Invoice Status': false,
    'Next Appointment Date': false,
    'Last Communication Date': false
  })

  const toggleColumn = async (columnName) => {
    const newVisibleColumns = {
      ...visibleColumns,
      [columnName]: !visibleColumns[columnName]
    }

    setVisibleColumns(newVisibleColumns)
    setShowColumnDropdown(false)

    // Save preferences to database (only if authenticated)
    if (apiService.isAuthenticated()) {
      try {
        await apiService.saveUserColumnPreferences(newVisibleColumns)
        console.log('Column preferences saved successfully')
      } catch (error) {
        console.warn('Failed to save column preferences:', error.message)
        // Don't show error to user, just log it - not critical
      }
    } else {
      console.log('User not authenticated, column preferences not saved')
    }
  }

  const startEditing = (client) => {
    setEditingRowId(client.client_id)
    setEditingData({
      name: client.name || '',
      email: client.email || '',
      notes: client.notes || '',
      tags: client.tags || []
    })
    setOriginalData({
      name: client.name || '',
      email: client.email || '',
      notes: client.notes || '',
      tags: client.tags || []
    })
  }

  const cancelEditing = () => {
    setEditingRowId(null)
    setEditingData({})
    setOriginalData({})
  }

  const saveEditing = async () => {
    if (!editingRowId) return

    try {
      const updatePayload = {}

      if (editingData.name !== originalData.name) updatePayload.name = editingData.name
      if (editingData.email !== originalData.email) updatePayload.email = editingData.email
      if (editingData.notes !== originalData.notes) updatePayload.notes = editingData.notes

      // Handle tags as array comparison
      const tagsChanged = JSON.stringify(editingData.tags) !== JSON.stringify(originalData.tags)
      if (tagsChanged) updatePayload.tags = editingData.tags

      if (Object.keys(updatePayload).length === 0) {
        cancelEditing()
        return
      }

      await apiService.updateClient(editingRowId, updatePayload)

      // ✅ 通知父組件客戶已更新，觸發重新載入
      if (onEdit) {
        await onEdit(editingRowId, updatePayload)
      }

      cancelEditing()
      console.log('Client updated successfully')
    } catch (error) {
      console.error('Failed to update client:', error)
      alert('Failed to save changes: ' + (error.message || 'Unknown error'))
    }
  }

  const handleEditingDataChange = (field, value) => {
    setEditingData({
      ...editingData,
      [field]: value
    })
  }

  // Load user column preferences on mount
  useEffect(() => {
    const loadColumnPreferences = async () => {
      try {
        // Add a small delay to ensure authentication is properly set up
        await new Promise(resolve => setTimeout(resolve, 100))
        
        if (!apiService.isAuthenticated()) {
          console.log('User not authenticated, using default column settings')
          return
        }

        const savedColumns = await apiService.getUserColumnPreferences()
        if (savedColumns && savedColumns.length > 0) {
          // ✅ 使用函數式更新，避免依賴 visibleColumns
          setVisibleColumns(prev => {
            const newVisibleColumns = { ...prev }
            
            // Set all columns to false first
            Object.keys(newVisibleColumns).forEach(key => {
              newVisibleColumns[key] = false
            })
            
            // Set saved columns to true
            savedColumns.forEach(columnName => {
              if (newVisibleColumns.hasOwnProperty(columnName)) {
                newVisibleColumns[columnName] = true
              }
            })
            
            return newVisibleColumns
          })
          console.log('Loaded user column preferences:', savedColumns)
        } else {
          console.log('No saved column preferences found, using defaults')
        }
      } catch (error) {
        console.warn('Failed to load column preferences, using defaults:', error.message)
        // Keep default settings if loading fails - this is not a critical error
      }
    }

    loadColumnPreferences()
  }, []) // Empty dependency array - run once on mount

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowColumnDropdown(false)
      }
    }

    if (showColumnDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showColumnDropdown])

  // Process client data with session counts
  const processedClients = useMemo(() => {
    if (!rows || !Array.isArray(rows)) return []
    
    return rows.map(client => {
      // Calculate session counts from meetings data (fallback if not in database)
      const clientMeetings = meetings.filter(meeting => meeting.client_id === client.client_id) || []
      const calculatedSessionCounts = clientMeetings.length
      
      // Debug: Log meeting_count for troubleshooting
      if (client.name === 'Amandatest' || client.name === 'Amanda') {
        console.log('🔍 DEBUG - Client meeting count:', {
          name: client.name,
          client_id: client.client_id,
          meeting_count: client.meeting_count,
          meeting_count_type: typeof client.meeting_count,
          calculatedSessionCounts,
          session_counts: client.session_counts,
          client_keys: Object.keys(client)
        })
      }
      
      // Priority: use meeting_count (SQL calculated) > calculated from meetings prop > session_counts from DB
      // Note: meeting_count can be 0, so we need to check for null/undefined specifically
      const sessionCounts = (client.meeting_count !== null && client.meeting_count !== undefined)
        ? Number(client.meeting_count) // Ensure it's a number
        : (calculatedSessionCounts > 0 
          ? calculatedSessionCounts 
          : ((client.session_counts !== null && client.session_counts !== undefined)
            ? Number(client.session_counts)
            : 0))
      
      // Get last session date
      const lastSessionDate = clientMeetings.length > 0 
        ? new Date(Math.max(...clientMeetings.map(m => new Date(m.created_at))))
        : null

      // Use info field directly from database
      const infoText = client.info || ''

      return {
        ...client,
        sessionCounts,
        totalSessions: sessionCounts, // Use sessionCounts (which is already the correct value)
        lastSessionDate,
        status: client.status || 'Active',
        notes: client.notes || '',
        info: infoText,
        is_favorite: client.is_favorite === 1 || client.is_favorite === '1' || client.is_favorite === true || false,
        // Contact Information
        address: client.address || '',
        // Business Information
        source: client.source || '',
        lead_status: client.lead_status || 'New',
        engagement_type: client.engagement_type || '',
        program: client.program || '',
        // Dates
        start_date: client.start_date ? new Date(client.start_date) : null,
        end_date: client.end_date ? new Date(client.end_date) : null,
        next_appointment_date: client.next_appointment_date ? new Date(client.next_appointment_date) : null,
        last_communication_date: client.last_communication_date ? new Date(client.last_communication_date) : null,
        // Administrative
        contract_status: client.contract_status || 'Pending',
        invoice_status: client.invoice_status || 'Pending',
        // Tags
        tags: client.tags ? (typeof client.tags === 'string' ? JSON.parse(client.tags) : client.tags) : []
      }
    })
  }, [rows, meetings])

  // Filter clients
  const filteredClients = useMemo(() => {
    return processedClients.filter(client => {
      const matchesSearch = !searchQuery || 
        client.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        client.profession?.toLowerCase().includes(searchQuery.toLowerCase())
      
      // When 'All' is selected, exclude 'Archived' clients by default
      // Users can explicitly select 'Archived' to view archived clients
      const matchesStatus = statusFilter === 'All' 
        ? (client.status !== 'Archived')
        : (client.status === statusFilter)
      
      return matchesSearch && matchesStatus
    })
  }, [processedClients, searchQuery, statusFilter])

  const statusOptions = ['All', 'Active', 'Inactive', 'Prospect', 'Lead', 'Paused', 'Archived']

  const dataReady = (!isLoading) && (rows !== undefined)

  return (
    <div style={{ padding: 16 }} data-testid="clients-table" data-ready={dataReady ? 'true' : 'false'}>
      {/* Loading state - 在容器內顯示，確保 data-testid 總是存在 */}
      {isLoading && (
        <div style={{ padding: 24, textAlign: 'center', color: '#6b7280', fontSize: '15px' }}>
          <p>Loading clients...</p>
        </div>
      )}
      
      {/* Table content - 只在非 loading 時顯示 */}
      {!isLoading && (
        <>
          {/* Header */}
          <div style={{ 
        textAlign: 'center',
        marginBottom: 16 
      }}>
        <div style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', letterSpacing: '-0.02em' }}>Clients</div>
      </div>
      
      {/* Filters */}
      <div style={{ 
        display: 'flex', 
        gap: 16, 
        alignItems: 'center',
        justifyContent: 'flex-start',
        flexWrap: 'wrap',
        marginBottom: 12
      }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            padding: '10px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            minWidth: '200px',
            backgroundColor: '#ffffff',
            color: '#374151',
            transition: 'border-color 0.2s ease'
          }}
        />
        
        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            padding: '10px 14px',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            fontSize: '14px',
            minWidth: '120px',
            backgroundColor: '#ffffff',
            color: '#374151',
            cursor: 'pointer',
            transition: 'border-color 0.2s ease'
          }}
        >
          {statusOptions.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div style={{ position: 'relative' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'auto', minWidth: '900px' }}>
          <thead>
            <tr>
              <th style={{ ...th, width: '40px' }}></th>
              {visibleColumns['Client Name'] && <th style={{ ...th, minWidth: '180px' }}>Client Name</th>}
              {visibleColumns['Info'] && <th style={{ ...th, minWidth: '220px' }}>Info</th>}
              {visibleColumns['Contact Information'] && <th style={{ ...th, minWidth: '180px' }}>Contact Info</th>}
              {visibleColumns['Source'] && <th style={{ ...th, minWidth: '120px' }}>Source</th>}
              {visibleColumns['Lead Status'] && <th style={{ ...th, minWidth: '120px' }}>Lead Status</th>}
              {visibleColumns['Engagement Type'] && <th style={{ ...th, minWidth: '140px' }}>Engagement Type</th>}
              {visibleColumns['Program'] && <th style={{ ...th, minWidth: '120px' }}>Program</th>}
              {visibleColumns['Start Date'] && <th style={{ ...th, minWidth: '120px' }}>Start Date</th>}
              {visibleColumns['End Date'] && <th style={{ ...th, minWidth: '120px' }}>End Date</th>}
              {visibleColumns['Next Appointment Date'] && <th style={{ ...th, minWidth: '150px' }}>Next Appointment</th>}
              {visibleColumns['Last Communication Date'] && <th style={{ ...th, minWidth: '150px' }}>Last Communication</th>}
              {visibleColumns['Contract Status'] && <th style={{ ...th, minWidth: '130px' }}>Contract Status</th>}
              {visibleColumns['Invoice Status'] && <th style={{ ...th, minWidth: '130px' }}>Invoice Status</th>}
              {visibleColumns['Notes'] && <th style={{ ...th, minWidth: '200px' }}>Notes</th>}
              {visibleColumns['Tags'] && <th style={{ ...th, minWidth: '150px' }}>Tags</th>}
              {visibleColumns['Session Counts'] && <th style={{ ...th, minWidth: '140px' }}>Session Counts</th>}
              {visibleColumns['Total Sessions'] && <th style={{ ...th, minWidth: '140px' }}>Total Sessions</th>}
              {visibleColumns['Status'] && <th style={{ ...th, minWidth: '100px' }}>Status</th>}
              <th style={{ ...th, width: '40px', position: 'relative' }} ref={dropdownRef}>
                <button
                  data-testid="columns-toggle"
                  onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                  style={{
                    background: 'none',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    width: '24px',
                    height: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    fontSize: '14px',
                    color: '#6b7280',
                    transition: 'all 0.1s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f3f4f6'
                    e.target.style.borderColor = '#9ca3af'
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'transparent'
                    e.target.style.borderColor = '#d1d5db'
                  }}
                >
                  +
                </button>
                
                {/* Column Dropdown */}
                {showColumnDropdown && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: '0',
                    backgroundColor: 'white',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                    zIndex: 1000,
                    minWidth: '280px',
                    padding: '8px 0'
                  }}>
                    {/* Core Client Information Section */}
                    <div style={{ padding: '8px 16px', borderBottom: '1px solid #f3f4f6' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        color: '#6b7280', 
                        textTransform: 'uppercase',
                        marginBottom: '8px'
                      }}>
                        Core Client Information
                      </div>
                      {[
                        'Client Name',
                        'Info',
                        'Session Counts',
                        'Total Sessions',
                        'Status',
                        'Contact Information', 
                        'Source',
                        'Lead Status',
                        'Engagement Type',
                        'Program',
                        'Start Date',
                        'End Date',
                        'Notes',
                        'Tags'
                      ].map(option => (
                        <div
                          key={option}
                          data-testid={`toggle-${option.replace(/\s+/g, '-')}`}
                          onClick={() => toggleColumn(option)}
                          style={{
                            padding: '6px 8px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: '#374151',
                            transition: 'background-color 0.1s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f3f4f6'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns[option]}
                            onChange={() => {}} // Handled by parent onClick
                            style={{ margin: 0, pointerEvents: 'none' }}
                          />
                          {option}
                        </div>
                      ))}
                    </div>
                    
                    {/* Administrative Section */}
                    <div style={{ padding: '8px 16px' }}>
                      <div style={{ 
                        fontSize: '12px', 
                        fontWeight: '600', 
                        color: '#6b7280', 
                        textTransform: 'uppercase',
                        marginBottom: '8px'
                      }}>
                        Administrative
                      </div>
                      {[
                        'Contract Status',
                        'Invoice Status',
                        'Next Appointment Date',
                        'Last Communication Date'
                      ].map(option => (
                        <div
                          key={option}
                          onClick={() => toggleColumn(option)}
                          style={{
                            padding: '6px 8px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            fontSize: '14px',
                            color: '#374151',
                            transition: 'background-color 0.1s ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#f3f4f6'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = 'transparent'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={visibleColumns[option]}
                            onChange={() => {}} // Handled by parent onClick
                            style={{ margin: 0, pointerEvents: 'none' }}
                          />
                          {option}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client) => (
              <tr 
                key={client.client_id}
                data-testid={`client-row-${client.client_id}`}
                onMouseEnter={() => setHoveredRowId(client.client_id)}
                onMouseLeave={() => setHoveredRowId(null)}
                style={{ 
                  cursor: 'pointer',
                  backgroundColor: hoveredRowId === client.client_id ? '#f3f4f6' : '#ffffff',
                  transition: 'background-color 0.1s ease'
                }}
                onClick={() => onClientClick && onClientClick(client)}
              >
                <td style={{ ...td, width: '40px', position: 'relative' }}>
                  <div 
                    data-testid={`client-row-actions-${client.client_id}`}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '4px',
                      /* 測試穩定化：保持可見，避免 headless 環境 hover 造成按鈕不可點 */
                      opacity: 1,
                      transition: 'opacity 0.2s ease'
                    }}
                  >
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite && onToggleFavorite(client.client_id, !client.is_favorite)
                      }}
                      style={{
                        ...actionBtn,
                        color: client.is_favorite ? '#ffc107' : '#6c757d',
                        fontSize: '20px'
                      }}
                      title={client.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#e9ecef'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent'
                      }}
                    >
                      {client.is_favorite ? '★' : '☆'}
                    </button>
                    {editingRowId === client.client_id ? (
                      <>
                        <button
                          data-testid={`save-client-${client.client_id}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            saveEditing()
                          }}
                          style={{
                            ...actionBtn,
                            backgroundColor: '#28a745',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '500',
                            width: 'auto',
                            padding: '6px 12px',
                            borderRadius: '4px'
                          }}
                          title="Save changes"
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#218838'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#28a745'
                          }}
                        >
                          Save
                        </button>
                        <button
                          data-testid={`cancel-client-${client.client_id}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            cancelEditing()
                          }}
                          style={{
                            ...actionBtn,
                            backgroundColor: '#6c757d',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '500',
                            width: 'auto',
                            padding: '6px 12px',
                            borderRadius: '4px'
                          }}
                          title="Cancel editing"
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#5a6268'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#6c757d'
                          }}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          data-testid={`edit-client-${client.client_id}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditing(client)
                          }}
                          style={{
                            ...actionBtn,
                            backgroundColor: '#17a2b8',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '500',
                            width: 'auto',
                            padding: '6px 12px',
                            borderRadius: '4px'
                          }}
                          title="Edit client"
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#138496'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#17a2b8'
                          }}
                        >
                          Edit
                        </button>
                        <button
                          data-testid={`open-client-${client.client_id}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            onClientClick && onClientClick(client)
                          }}
                          style={{
                            ...actionBtn,
                            backgroundColor: '#007bff',
                            color: 'white',
                            fontSize: '12px',
                            fontWeight: '500',
                            width: 'auto',
                            padding: '6px 12px',
                            borderRadius: '4px'
                          }}
                          title="Open client details"
                          onMouseEnter={(e) => {
                            e.target.style.backgroundColor = '#0056b3'
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.backgroundColor = '#007bff'
                          }}
                        >
                          Open
                        </button>
                      </>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete && onDelete(client)
                      }}
                      style={{...actionBtn, color: '#dc3545'}}
                      title="Archive client"
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f8d7da'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent'
                      }}
                    >
                      📦
                    </button>
                  </div>
                </td>
                
                {visibleColumns['Client Name'] && (
                  <td style={{ ...td, minWidth: '180px', backgroundColor: editingRowId === client.client_id ? '#eff6ff' : hoveredRowId === client.client_id ? '#f3f4f6' : '#ffffff' }}>
                    {editingRowId === client.client_id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          data-testid={`edit-name-${client.client_id}`}
                          type="text"
                          value={editingData.name || ''}
                          onChange={(e) => handleEditingDataChange('name', e.target.value)}
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            fontWeight: '600'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <input
                          data-testid={`edit-email-${client.client_id}`}
                          type="email"
                          value={editingData.email || ''}
                          onChange={(e) => handleEditingDataChange('email', e.target.value)}
                          style={{
                            padding: '6px 8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '12px'
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <div>
                        <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '2px', fontSize: '14px' }}>
                          {client.name}
                        </div>
                        <div style={{ fontSize: '13px', color: '#6b7280', lineHeight: '1.4' }}>
                          {client.email}
                        </div>
                      </div>
                    )}
                  </td>
                )}
                
                {visibleColumns['Info'] && (
                  <td style={{ ...td, minWidth: '220px' }}>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#374151',
                      whiteSpace: 'pre-line'
                    }}>
                      {client.info}
                    </div>
                  </td>
                )}
                
                {/* Dynamic Columns */}
                {visibleColumns['Contact Information'] && (
                  <td style={{ ...td, minWidth: '180px' }}>
                    <div>
                      {client.address && (
                        <div style={{ fontSize: '14px', marginBottom: '2px' }}>
                          <strong>Address:</strong> {client.address}
                        </div>
                      )}
                    </div>
                  </td>
                )}
                
                {visibleColumns['Source'] && (
                  <td style={{ ...td, minWidth: '120px' }}>
                    <span style={{ fontSize: '14px' }}>{client.source}</span>
                  </td>
                )}
                
                {visibleColumns['Lead Status'] && (
                  <td style={{ ...td, minWidth: '120px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: getLeadStatusColor(client.lead_status).bg,
                      color: getLeadStatusColor(client.lead_status).text
                    }}>
                      {client.lead_status}
                    </span>
                  </td>
                )}
                
                {visibleColumns['Engagement Type'] && (
                  <td style={{ ...td, minWidth: '140px' }}>
                    <span style={{ fontSize: '14px' }}>{client.engagement_type}</span>
                  </td>
                )}
                
                {visibleColumns['Program'] && (
                  <td style={{ ...td, minWidth: '120px' }}>
                    <span style={{ fontSize: '14px' }}>{client.program}</span>
                  </td>
                )}
                
                {visibleColumns['Start Date'] && (
                  <td style={{ ...td, minWidth: '120px' }}>
                    <span style={{ fontSize: '14px' }}>
                      {client.start_date ? client.start_date.toLocaleDateString() : '-'}
                    </span>
                  </td>
                )}
                
                {visibleColumns['End Date'] && (
                  <td style={{ ...td, minWidth: '120px' }}>
                    <span style={{ fontSize: '14px' }}>
                      {client.end_date ? client.end_date.toLocaleDateString() : '-'}
                    </span>
                  </td>
                )}
                
                {visibleColumns['Next Appointment Date'] && (
                  <td style={{ ...td, minWidth: '150px' }}>
                    <span style={{ fontSize: '14px' }}>
                      {client.next_appointment_date ? client.next_appointment_date.toLocaleDateString() : '-'}
                    </span>
                  </td>
                )}
                
                {visibleColumns['Last Communication Date'] && (
                  <td style={{ ...td, minWidth: '150px' }}>
                    <span style={{ fontSize: '14px' }}>
                      {client.last_communication_date ? client.last_communication_date.toLocaleDateString() : '-'}
                    </span>
                  </td>
                )}
                
                {visibleColumns['Contract Status'] && (
                  <td style={{ ...td, minWidth: '130px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: getContractStatusColor(client.contract_status).bg,
                      color: getContractStatusColor(client.contract_status).text
                    }}>
                      {client.contract_status}
                    </span>
                  </td>
                )}
                
                {visibleColumns['Invoice Status'] && (
                  <td style={{ ...td, minWidth: '130px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '2px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: getInvoiceStatusColor(client.invoice_status).bg,
                      color: getInvoiceStatusColor(client.invoice_status).text
                    }}>
                      {client.invoice_status}
                    </span>
                  </td>
                )}
                
                {visibleColumns['Notes'] && (
                  <td style={{ ...td, minWidth: '200px', backgroundColor: editingRowId === client.client_id ? '#eff6ff' : hoveredRowId === client.client_id ? '#f3f4f6' : '#ffffff' }}>
                    {editingRowId === client.client_id ? (
                      <textarea
                        value={editingData.notes || ''}
                        onChange={(e) => handleEditingDataChange('notes', e.target.value)}
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontFamily: 'inherit',
                          width: '100%',
                          minHeight: '60px',
                          resize: 'vertical'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        maxWidth: '180px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {client.notes}
                      </div>
                    )}
                  </td>
                )}
                
                {visibleColumns['Tags'] && (
                  <td style={{ ...td, minWidth: '150px', backgroundColor: editingRowId === client.client_id ? '#eff6ff' : hoveredRowId === client.client_id ? '#f3f4f6' : '#ffffff' }}>
                    {editingRowId === client.client_id ? (
                      <input
                        type="text"
                        value={Array.isArray(editingData.tags) ? editingData.tags.join(', ') : editingData.tags || ''}
                        onChange={(e) => {
                          const tagsString = e.target.value
                          const tagsArray = tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
                          handleEditingDataChange('tags', tagsArray)
                        }}
                        placeholder="Enter tags separated by commas"
                        style={{
                          padding: '6px 8px',
                          border: '1px solid #d1d5db',
                          borderRadius: '4px',
                          fontSize: '12px',
                          width: '100%'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {client.tags.map((tag, index) => (
                          <span
                            key={index}
                            style={{
                              fontSize: '10px',
                              padding: '2px 6px',
                              backgroundColor: typeof tag === 'object' ? tag.color || '#e5e7eb' : '#e5e7eb',
                              color: '#374151',
                              borderRadius: '8px',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {typeof tag === 'object' ? tag.name : tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>
                )}

                {visibleColumns['Session Counts'] && (
                  <td style={{ ...td, minWidth: '140px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: '600', 
                        color: '#374151' 
                      }}>
                        {client.sessionCounts}
                      </div>
                      {client.lastSessionDate && (
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#6b7280',
                          marginTop: '2px'
                        }}>
                          Last: {client.lastSessionDate.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                )}
                
                {visibleColumns['Total Sessions'] && (
                  <td style={{ ...td, minWidth: '140px' }}>
                    <div style={{ 
                      textAlign: 'center',
                      fontSize: '16px',
                      fontWeight: '500',
                      color: '#374151'
                    }}>
                      {client.totalSessions}
                    </div>
                  </td>
                )}
                
                {visibleColumns['Status'] && (
                  <td style={{ ...td, minWidth: '100px' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '4px 12px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: getStatusColor(client.status).bg,
                      color: getStatusColor(client.status).text
                    }}>
                      {client.status}
                    </span>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredClients.length === 0 && (
        <div style={{ 
          padding: '40px 20px', 
          textAlign: 'center', 
          color: '#6b7280',
          background: '#f9fafb',
          borderRadius: '8px',
          border: '1px solid #e9ecef',
          marginTop: '16px'
        }}>
          {searchQuery || statusFilter !== 'All' ? (
            <>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>No clients match your filters</div>
              <div style={{ fontSize: '14px' }}>Try adjusting your search or status filter</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>No clients found</div>
              <div style={{ fontSize: '14px' }}>Start by adding some clients to your system</div>
            </>
          )}
        </div>
      )}
        </>
      )}
    </div>
  )
}

// Helper function for status colors
function getStatusColor(status) {
  const colors = {
    'Active': { bg: '#dcfce7', text: '#166534' },
    'Inactive': { bg: '#f3f4f6', text: '#6b7280' },
    'Prospect': { bg: '#dbeafe', text: '#1d4ed8' },
    'Lead': { bg: '#fef3c7', text: '#92400e' },
    'Paused': { bg: '#fed7d7', text: '#c53030' },
    'Archived': { bg: '#e5e7eb', text: '#374151' }
  }
  return colors[status] || colors['Active']
}

// Helper function for lead status colors
function getLeadStatusColor(status) {
  const colors = {
    'New': { bg: '#dbeafe', text: '#1d4ed8' },
    'Contacted': { bg: '#fef3c7', text: '#92400e' },
    'Qualified': { bg: '#dcfce7', text: '#166534' },
    'Converted': { bg: '#d1fae5', text: '#065f46' },
    'Lost': { bg: '#fed7d7', text: '#c53030' }
  }
  return colors[status] || colors['New']
}

// Helper function for contract status colors
function getContractStatusColor(status) {
  const colors = {
    'Pending': { bg: '#fef3c7', text: '#92400e' },
    'Active': { bg: '#dcfce7', text: '#166534' },
    'Expired': { bg: '#fed7d7', text: '#c53030' },
    'Cancelled': { bg: '#e5e7eb', text: '#374151' }
  }
  return colors[status] || colors['Pending']
}

// Helper function for invoice status colors
function getInvoiceStatusColor(status) {
  const colors = {
    'Pending': { bg: '#fef3c7', text: '#92400e' },
    'Sent': { bg: '#dbeafe', text: '#1d4ed8' },
    'Paid': { bg: '#dcfce7', text: '#166534' },
    'Overdue': { bg: '#fed7d7', text: '#c53030' }
  }
  return colors[status] || colors['Pending']
}

const th = {
  textAlign: 'left',
  padding: '12px 8px',
  borderBottom: '2px solid #e5e7eb',
  backgroundColor: '#f9fafb',
  color: '#1f2937',
  fontWeight: 600,
  fontSize: '14px',
  letterSpacing: '0.01em'
}

const td = {
  padding: '12px 8px',
  borderBottom: '1px solid #f3f4f6',
  color: '#374151',
  verticalAlign: 'top',
  fontSize: '14px',
  lineHeight: '1.5'
}

const actionBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '6px',
  borderRadius: '6px',
  fontSize: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '32px',
  height: '32px',
  color: '#6c757d',
  transition: 'all 0.1s ease'
}
