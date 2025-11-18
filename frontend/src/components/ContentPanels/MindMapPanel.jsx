import React from 'react'

const MindMapPanel = ({ mindMap, isGeneratingMindMap, mindMapError, downloadMindMap, mindMapRef }) => {
  console.log('MindMapPanel render - mindMap:', mindMap ? mindMap.substring(0, 100) + '...' : 'null')
  console.log('MindMapPanel render - mindMapError:', mindMapError)
  console.log('MindMapPanel render - isGeneratingMindMap:', isGeneratingMindMap)
  
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#222' }}>Mind Map</div>
        {mindMap && <button onClick={downloadMindMap}>Download</button>}
      </div>
      {isGeneratingMindMap ? (
        <span className="loading-indicator" style={{ display: 'block', width: '100%', minWidth: '800px' }}>
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
          <span className="loading-dot"></span>
          Generating...
        </span>
      ) : mindMap ? (
        <div style={{ overflowX: 'auto', flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div className="mermaid" ref={mindMapRef} style={{ background: '#fff', borderRadius: 8, padding: 16, width: '100%', minWidth: '800px', height: '70vh', minHeight: 600 }}></div>
        </div>
      ) : mindMapError ? (
        <div style={{ color: 'red', padding: '20px', background: '#fff3f3', borderRadius: '8px', border: '1px solid #ffcdd2' }}>
          <strong>Error:</strong> {mindMapError}
          {mindMap && (
            <div style={{ marginTop: '10px', fontSize: '14px' }}>
              <strong>Mermaid Code:</strong>
              <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto', maxHeight: '200px' }}>
                {mindMap}
              </pre>
            </div>
          )}
        </div>
      ) : (
        <div style={{ color: '#666', textAlign: 'center', padding: '40px' }}>
          No mind map data available
        </div>
      )}
    </>
  )
}

export default MindMapPanel 