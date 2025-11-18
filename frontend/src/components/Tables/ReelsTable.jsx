import React, { useMemo, useState, useEffect, useCallback } from 'react'

export default function ReelsTable({ rows, isLoading, onToggleFavorite, onEdit, onDelete }) {
  const [hoveredRowId, setHoveredRowId] = useState(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  // Provide minimal local state for edit modal references to avoid no-undef
  const [editingReel, setEditingReel] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  
  // Use useCallback to stabilize the function reference
  const handleSaveReel = useCallback((updated) => {
    if (onEdit) onEdit(updated)
    setIsEditModalOpen(false)
  }, [onEdit])
  
  // Use useCallback to stabilize the close function
  const handleCloseModal = useCallback(() => {
    setIsEditModalOpen(false)
  }, [])
  
  const hasRows = Array.isArray(rows) && rows.length > 0
  const normalizedRows = useMemo(() => (rows || []).map(r => ({
    ...r,
    is_favorite: r.is_favorite === 1 || r.is_favorite === '1' || r.is_favorite === true
  })), [rows])

  const filteredRows = useMemo(() => {
    if (!showFavoritesOnly) return normalizedRows
    return normalizedRows.filter(r => r.is_favorite)
  }, [normalizedRows, showFavoritesOnly])

  if (isLoading) {
    return <div style={{ padding: 16, color: '#6b7280', fontSize: '15px' }} data-testid="reels-container" data-ready="false">Loading reels...</div>
  }
  if (!hasRows) {
    return <div style={{ padding: 16, color: '#6b7280', fontSize: '15px' }} data-testid="reels-container" data-ready="true"><span data-testid="reels-empty">No reels found</span></div>
  }

  if (filteredRows.length === 0 && showFavoritesOnly) {
    return (
      <div style={{ padding: 16 }}>
        <div style={{ 
          textAlign: 'center',
          marginBottom: 16 
        }}>
          <div style={{ fontSize: 24, fontWeight: 700, color: '#1f2937', letterSpacing: '-0.02em' }}>Reels Scripts</div>
        </div>
        <div style={{ position: 'relative' }}>
          <div style={{ 
            position: 'absolute', 
            top: '-40px', 
            left: '48px',
            marginBottom: 12 
          }}>
            <button
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                border: '1px solid #e1e4e8',
                borderRadius: '6px',
                background: showFavoritesOnly ? '#f6f8fa' : 'transparent',
                color: '#24292e',
                fontSize: '14px',
                cursor: 'pointer',
                fontWeight: showFavoritesOnly ? 500 : 400,
                transition: 'all 0.1s ease'
              }}
              onMouseEnter={(e) => {
                if (!showFavoritesOnly) {
                  e.target.style.backgroundColor = '#f3f4f6'
                }
              }}
              onMouseLeave={(e) => {
                if (!showFavoritesOnly) {
                  e.target.style.backgroundColor = '#ffffff'
                }
              }}
            >
              <span>★</span>
              <span>Favorites</span>
            </button>
          </div>
          <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0', fontSize: '15px', lineHeight: '1.6' }}>
            No favorite reels found. Try clicking the Favorites button to show all reels or add some reels to favorites.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 16 }} data-testid="reels-container" data-ready="true">
      <div style={{ 
        textAlign: 'center',
        marginBottom: 16 
      }}>
        <div style={{ fontSize: 24, fontWeight: 700 }} data-testid="reels-title">Reels Scripts</div>
      </div>
      <div style={{ position: 'relative' }}>
        <div style={{ 
          position: 'absolute', 
          top: '-40px', 
          left: '48px',
          marginBottom: 12 
        }}>
          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              background: showFavoritesOnly ? '#f3f4f6' : '#ffffff',
              color: '#374151',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: showFavoritesOnly ? 500 : 400,
              transition: 'all 0.1s ease'
            }}
            onMouseEnter={(e) => {
              if (!showFavoritesOnly) {
                e.target.style.backgroundColor = '#f6f8fa'
              }
            }}
            onMouseLeave={(e) => {
              if (!showFavoritesOnly) {
                e.target.style.backgroundColor = 'transparent'
              }
            }}
          >
            <span>★</span>
            <span>Favorites</span>
          </button>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }} data-testid="reels-table">
          <thead>
            <tr>
              <th style={{ ...th, width: '40px' }}></th>
              <th style={th}>Hook</th>
              <th style={th}>Content</th>
              <th style={th}>Narrative</th>
              <th style={th}>Call to Action</th>
              <th style={th}>Tags</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((r) => (
              <tr 
                key={r.id}
                onClick={() => {
                  setEditingReel(r)
                  setIsEditModalOpen(true)
                }}
                onMouseEnter={() => setHoveredRowId(r.id)}
                onMouseLeave={() => setHoveredRowId(null)}
                style={{ 
                  cursor: 'pointer',
                  backgroundColor: hoveredRowId === r.id ? '#f3f4f6' : '#ffffff',
                  transition: 'background-color 0.1s ease'
                }}
              >
                <td style={{ ...td, width: '40px', position: 'relative' }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '4px',
                    opacity: hoveredRowId === r.id ? 1 : 0,
                    transition: 'opacity 0.2s ease'
                  }}>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        onToggleFavorite(r.id, !r.is_favorite)
                      }}
                      style={{
                        ...actionBtn,
                        color: r.is_favorite ? '#ffc107' : '#6c757d',
                        fontSize: '20px'
                      }}
                      title={r.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f3f4f6'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent'
                      }}
                    >
                      {r.is_favorite ? '★' : '☆'}
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        setEditingReel(r)
                        setIsEditModalOpen(true)
                      }}
                      style={actionBtn}
                      title="Edit reel"
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f3f4f6'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent'
                      }}
                    >
                      ✎
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete(r)
                      }}
                      style={{...actionBtn, color: '#dc3545'}}
                      title="Delete reel"
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#f8d7da'
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'transparent'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </td>
                <td style={td}>{r.hook || '-'}</td>
                <td style={td}>{r.content || '-'}</td>
                <td style={td}>{r.narrative || '-'}</td>
                <td style={td}>{r.call_to_action || '-'}</td>
                <td style={td}>{Array.isArray(r.tags) ? r.tags.join(' ') : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <EditReelModal
        reel={editingReel}
        isOpen={isEditModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveReel}
      />
    </div>
  )
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
  lineHeight: '1.5',
  backgroundColor: '#ffffff'
}

const btn = {
  padding: '6px 10px',
  borderRadius: 6,
  background: '#007bff',
  border: '1px solid #007bff',
  color: '#fff',
  cursor: 'pointer'
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

// Edit Reel Modal Component
function EditReelModal({ reel, isOpen, onClose, onSave }) {
  // ✅ 所有 Hook 必須在條件返回之前調用
  const [hook, setHook] = useState('')
  const [content, setContent] = useState('')
  const [callToAction, setCallToAction] = useState('')
  const [tags, setTags] = useState([])
  const [tagsInput, setTagsInput] = useState('')

  // ✅ 使用 reel.id 作為依賴項，而不是整個 reel 對象，避免無限循環
  const reelId = reel?.id
  
  useEffect(() => {
    // Only update form when modal opens with a new reel
    if (reel && isOpen && reelId) {
      setHook(reel.hook || '')
      // Extract narrative and CTA from content if they're combined
      const fullContent = reel.content || reel.narrative || ''
      if (fullContent.includes('\nCTA: ')) {
        const parts = fullContent.split('\nCTA: ')
        setContent(parts[0] || '')
        setCallToAction(parts[1] || '')
      } else {
        setContent(fullContent)
        setCallToAction(reel.call_to_action || reel.callToAction || '')
      }
      const reelTags = reel.tags || []
      setTags(Array.isArray(reelTags) ? reelTags : [])
      setTagsInput(Array.isArray(reelTags) ? reelTags.join(', ') : '')
    }
  }, [reelId, isOpen]) // ✅ 只依賴 reel.id 和 isOpen，避免對象引用變化

  // Close modal on Escape key and manage body scroll lock
  // ✅ 單一 useEffect 處理所有邏輯，確保 Hook 調用次數一致
  useEffect(() => {
    if (!isOpen) {
      // 當模態框關閉時，確保 body overflow 被重置
      document.body.style.overflow = 'unset'
      return
    }
    
    // 當模態框打開時，設置事件監聽器和滾動鎖定
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    
    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'
    
    // 清理函數：無論如何都會執行
    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]) // onClose is stable, no need to include in deps

  // ✅ 條件返回必須在所有 Hook 之後
  if (!isOpen) {
    return null
  }

  const handleSave = () => {
    // Parse tags from input
    const parsedTags = tagsInput.split(',').map(t => t.trim()).filter(t => t.length > 0)
    
    onSave({
      id: reel.id,
      hook,
      content: content + (callToAction ? `\nCTA: ${callToAction}` : ''),
      narrative: content,
      callToAction,
      tags: parsedTags
    })
  }

  const handleCancel = () => {
    onClose()
  }

  // Close modal when clicking outside
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      handleCancel()
    }
  }

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
          padding: '24px',
          borderRadius: '12px',
          width: '90%',
          maxWidth: '600px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)'
        }}
      >
        <h2 style={{ 
          margin: '0 0 20px 0', 
          fontSize: '24px', 
          fontWeight: '700',
          color: '#111827'
        }}>
          Edit Reel
        </h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ 
              display: 'block', 
              marginBottom: '8px', 
              fontSize: '14px', 
              fontWeight: '600',
              color: '#374151'
            }}>
              Hook
            </label>
            <input
              type="text"
              value={hook}
              onChange={(e) => setHook(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter hook text..."
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
              Content / Narrative
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                minHeight: '120px',
                resize: 'vertical',
                boxSizing: 'border-box',
                fontFamily: 'inherit'
              }}
              placeholder="Enter content/narrative..."
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
              Call to Action
            </label>
            <input
              type="text"
              value={callToAction}
              onChange={(e) => setCallToAction(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter call to action..."
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
              Tags (comma-separated)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                fontSize: '14px',
                boxSizing: 'border-box'
              }}
              placeholder="Enter tags separated by commas..."
            />
          </div>
        </div>

        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px', 
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '10px 20px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              background: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f9fafb'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'white'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              border: 'none',
              borderRadius: '8px',
              background: '#3b82f6',
              color: 'white',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#2563eb'
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#3b82f6'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
