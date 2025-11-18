import React from 'react'
import { useMermaidRenderer } from '../../hooks/useMermaidRenderer'

/**
 * MindMapViewer Component
 * Renders a Mermaid mind map diagram with loading and error states
 *
 * @param {string} mindMapCode - Raw Mermaid mind map code
 * @param {object} containerStyle - Custom CSS styles for the container
 * @returns {JSX.Element}
 */
export const MindMapViewer = ({ mindMapCode, containerStyle = {} }) => {
  const { containerRef, isRendering, error } = useMermaidRenderer(mindMapCode)

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '300px',
        ...containerStyle
      }}
    >
      {/* Loading State */}
      {isRendering && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            zIndex: 10
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '14px', color: '#666', marginBottom: '10px' }}>
              Rendering mind map...
            </div>
            <div
              style={{
                width: '30px',
                height: '30px',
                border: '3px solid #e2e8f0',
                borderTop: '3px solid #4299e1',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}
            />
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div
          style={{
            backgroundColor: '#fed7d7',
            border: '1px solid #fc8181',
            borderRadius: '8px',
            padding: '16px',
            color: '#742a2a',
            fontSize: '14px'
          }}
        >
          <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>Error rendering mind map:</div>
          <div>{error}</div>
        </div>
      )}

      {/* Mermaid Diagram Container */}
      {!error && (
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '100%',
            minHeight: '300px',
            backgroundColor: '#f7fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
            overflow: 'auto'
          }}
        />
      )}

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default MindMapViewer
