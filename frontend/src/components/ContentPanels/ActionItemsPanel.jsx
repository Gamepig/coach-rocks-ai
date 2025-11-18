import React from 'react'

const ActionItemsPanel = ({ type, actionItems, downloadActionItems }) => {
  const title = type === 'client' ? 'Action Items for Client' : 'Action Items for Coach'
  
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#222' }}>{title}</div>
        <button onClick={downloadActionItems}>Download</button>
      </div>
      <div style={{ fontSize: 20, color: '#3a4664', lineHeight: 1.7, marginBottom: 32 }}>{actionItems}</div>
    </>
  )
}

export default ActionItemsPanel 