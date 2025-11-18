import React from 'react'

const SummaryPanel = ({ summary, downloadSummary }) => {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#222' }}>Summary</div>
        <button onClick={downloadSummary}>Download</button>
      </div>
      <div style={{ fontSize: 20, color: '#3a4664', lineHeight: 1.7, marginBottom: 32 }}>{summary}</div>
    </>
  )
}

export default SummaryPanel 