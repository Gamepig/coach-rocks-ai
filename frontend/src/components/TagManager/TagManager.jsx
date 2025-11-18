import React, { useState } from 'react'
import TagForm from './TagForm'
import TagList from './TagList'

export default function TagManager({ tags, isLoading, onCreateTag, onUpdateTag, onDeleteTag }) {
  const [showForm, setShowForm] = useState(false)
  const [editingTag, setEditingTag] = useState(null)

  const handleCreateTag = async (tagData) => {
    try {
      await onCreateTag(tagData)
      setShowForm(false)
    } catch (error) {
      console.error('Error creating tag:', error)
      alert('Failed to create tag. Please try again.')
    }
  }

  const handleUpdateTag = async (tagData) => {
    try {
      await onUpdateTag(editingTag.id, tagData)
      setEditingTag(null)
      setShowForm(false)
    } catch (error) {
      console.error('Error updating tag:', error)
      alert('Failed to update tag. Please try again.')
    }
  }

  const handleEditTag = (tag) => {
    setEditingTag(tag)
    setShowForm(true)
  }

  const handleCancelForm = () => {
    setShowForm(false)
    setEditingTag(null)
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '24px' 
      }}>
        <h2 style={{ margin: 0, color: '#222', fontSize: '24px' }}>Tag Management</h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            style={{
              padding: '10px 16px',
              border: 'none',
              borderRadius: '6px',
              background: '#007bff',
              color: '#fff',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Create New Tag
          </button>
        )}
      </div>

      {showForm && (
        <div style={{ 
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <TagForm
            tag={editingTag}
            onSubmit={editingTag ? handleUpdateTag : handleCreateTag}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      <div>
        <h3 style={{ margin: '0 0 16px 0', color: '#333', fontSize: '18px' }}>
          Your Tags ({tags?.length || 0})
        </h3>
        <TagList
          tags={tags}
          isLoading={isLoading}
          onEdit={handleEditTag}
          onDelete={onDeleteTag}
        />
      </div>
    </div>
  )
} 