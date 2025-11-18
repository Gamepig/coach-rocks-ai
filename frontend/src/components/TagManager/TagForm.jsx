import React, { useState, useEffect } from 'react'

export default function TagForm({ tag = null, onSubmit, onCancel }) {
  const [name, setName] = useState('')
  const [color, setColor] = useState('#3B82F6')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (tag) {
      setName(tag.name || '')
      setColor(tag.color || '#3B82F6')
    }
  }, [tag])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) {
      alert('Tag name is required')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({ name: name.trim(), color })
    } catch (error) {
      console.error('Error submitting tag:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{
      background: '#fff',
      padding: '20px',
      borderRadius: '8px',
      border: '1px solid #e9ecef',
      maxWidth: '400px'
    }}>
      <h3 style={{ margin: '0 0 20px 0', color: '#222' }}>
        {tag ? 'Edit Tag' : 'Create New Tag'}
      </h3>
      
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
          Tag Name *
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter tag name"
          style={{
            width: '100%',
            padding: '10px 12px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            fontSize: '14px'
          }}
          required
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
          Color
        </label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            style={{
              width: '50px',
              height: '40px',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          />
          <span style={{ fontSize: '14px', color: '#666' }}>{color}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            padding: '10px 16px',
            border: '1px solid #ddd',
            borderRadius: '6px',
            background: '#fff',
            color: '#666',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            background: isSubmitting || !name.trim() ? '#ccc' : '#007bff',
            color: '#fff',
            cursor: isSubmitting || !name.trim() ? 'not-allowed' : 'pointer'
          }}
        >
          {isSubmitting ? 'Saving...' : (tag ? 'Update Tag' : 'Create Tag')}
        </button>
      </div>
    </form>
  )
} 