import React, { useState, useEffect } from 'react'

export default function TagList({ tags, onEdit, onDelete, isLoading }) {
  const [editingTag, setEditingTag] = useState(null)
  const [deletingTag, setDeletingTag] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [tagToDelete, setTagToDelete] = useState(null)

  const handleEdit = (tag) => {
    setEditingTag(tag)
    onEdit(tag)
  }

  const handleDelete = async (tag) => {
    setTagToDelete(tag)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (tagToDelete) {
      setDeletingTag(tagToDelete.id)
      try {
        await onDelete(tagToDelete.id)
        setShowDeleteModal(false)
        setTagToDelete(null)
      } finally {
        setDeletingTag(null)
      }
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setTagToDelete(null)
  }

  // Close modal when clicking outside or pressing Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && showDeleteModal) {
        cancelDelete()
      }
    }

    if (showDeleteModal) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [showDeleteModal])

  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Loading tags...</div>
  }

  if (!tags || tags.length === 0) {
    return (
      <div style={{ 
        padding: '40px 20px', 
        textAlign: 'center', 
        color: '#666',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ fontSize: '18px', marginBottom: '8px' }}>No tags created yet</div>
        <div style={{ fontSize: '14px' }}>Create your first tag to start organizing clients</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {tags.map((tag) => (
        <div
          key={tag.id}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            background: '#fff',
            border: '1px solid #e9ecef',
            borderRadius: '8px',
            transition: 'all 0.2s ease'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: tag.color,
                border: '2px solid #fff',
                boxShadow: '0 0 0 1px #ddd'
              }}
            />
            <span style={{ fontSize: '14px', fontWeight: '500', color: '#222' }}>
              {tag.name}
            </span>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleEdit(tag)}
              style={{
                padding: '6px 12px',
                border: '1px solid #007bff',
                borderRadius: '4px',
                background: 'transparent',
                color: '#007bff',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(tag)}
              disabled={deletingTag === tag.id}
              style={{
                padding: '6px 12px',
                border: '1px solid #dc3545',
                borderRadius: '4px',
                background: deletingTag === tag.id ? '#ccc' : 'transparent',
                color: deletingTag === tag.id ? '#666' : '#dc3545',
                cursor: deletingTag === tag.id ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              {deletingTag === tag.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      ))}
      
      {/* Custom Delete Confirmation Modal */}
      {showDeleteModal && tagToDelete && (
        <div 
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
          onClick={cancelDelete}
        >
          <div 
            style={{
              background: '#fff',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '400px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
              border: '1px solid #e5e7eb'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '16px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: '#fef2f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"></path>
                </svg>
              </div>
              <div>
                <h3 style={{
                  margin: 0,
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#111827'
                }}>
                  Delete Tag
                </h3>
                <p style={{
                  margin: '4px 0 0 0',
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  This action cannot be undone
                </p>
              </div>
            </div>

            {/* Message */}
            <div style={{
              padding: '16px',
              background: '#f9fafb',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              marginBottom: '24px'
            }}>
              <p style={{
                margin: 0,
                fontSize: '14px',
                color: '#374151',
                lineHeight: '1.5'
              }}>
                Are you sure you want to delete the tag <strong>"{tagToDelete.name}"</strong>? 
                This will remove it from all clients.
              </p>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={cancelDelete}
                style={{
                  padding: '10px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  background: '#fff',
                  color: '#374151',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.borderColor = '#9ca3af'
                  e.target.style.background = '#f9fafb'
                }}
                onMouseLeave={(e) => {
                  e.target.style.borderColor = '#d1d5db'
                  e.target.style.background = '#fff'
                }}
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deletingTag === tagToDelete.id}
                style={{
                  padding: '10px 16px',
                  border: 'none',
                  borderRadius: '8px',
                  background: deletingTag === tagToDelete.id ? '#9ca3af' : '#ef4444',
                  color: '#fff',
                  cursor: deletingTag === tagToDelete.id ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  if (deletingTag !== tagToDelete.id) {
                    e.target.style.background = '#dc2626'
                  }
                }}
                onMouseLeave={(e) => {
                  if (deletingTag !== tagToDelete.id) {
                    e.target.style.background = '#ef4444'
                  }
                }}
              >
                {deletingTag === tagToDelete.id ? 'Deleting...' : 'Delete Tag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 
