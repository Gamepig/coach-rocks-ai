import React from 'react'

const ResourcesPanel = ({ 
  resourcesList, 
  downloadResourcesList, 
  onGenerateResourcesList, 
  isGeneratingResources = false,
  resourcesError = null 
}) => {
  console.log('ResourcesPanel received resourcesList:', resourcesList)
  
  if (!resourcesList || resourcesList.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
        <div style={{ fontSize: 18, marginBottom: 16 }}>No resources available</div>
        <div style={{ fontSize: 14, marginBottom: 24 }}>
          Click the button below to generate relevant resources for your coaching session
        </div>
        <button 
          onClick={onGenerateResourcesList}
          disabled={isGeneratingResources}
          style={{
            padding: '12px 24px',
            fontSize: 16,
            fontWeight: 600,
            borderRadius: 8,
            background: isGeneratingResources ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            cursor: isGeneratingResources ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {isGeneratingResources ? 'Generating...' : 'Generate Resources List'}
        </button>
        {resourcesError && (
          <div style={{ marginTop: 16, color: '#dc3545', fontSize: 14 }}>
            Error: {resourcesError}
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#222' }}>Resources List</div>
        <button onClick={downloadResourcesList}>Download</button>
      </div>
      
      {resourcesError && (
        <div style={{ 
          marginBottom: 16, 
          padding: '12px 16px', 
          background: '#f8d7da', 
          border: '1px solid #f5c6cb', 
          borderRadius: 6, 
          color: '#721c24' 
        }}>
          Error: {resourcesError}
        </div>
      )}
      
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 18, color: '#666', marginBottom: 16 }}>
          Here are some relevant resources to help with your coaching session:
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {resourcesList.map((resource, index) => (
            <div 
              key={index}
              style={{
                background: '#f8f9fa',
                borderRadius: 12,
                padding: 20,
                border: '1px solid #e9ecef',
                transition: 'all 0.2s ease'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ fontSize: 18, fontWeight: 600, color: '#222', flex: 1 }}>
                  {resource.title}
                </div>
                <div style={{ 
                  background: '#007bff', 
                  color: 'white', 
                  padding: '4px 12px', 
                  borderRadius: 20, 
                  fontSize: 12, 
                  fontWeight: 500,
                  textTransform: 'capitalize'
                }}>
                  {resource.type}
                </div>
              </div>
              
              <div style={{ fontSize: 16, color: '#666', lineHeight: 1.6, marginBottom: 16 }}>
                {resource.description}
              </div>
              
              <a 
                href={resource.url} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  color: '#007bff',
                  textDecoration: 'none',
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                <span>🔗</span>
                {resource.url}
              </a>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}

export default ResourcesPanel 