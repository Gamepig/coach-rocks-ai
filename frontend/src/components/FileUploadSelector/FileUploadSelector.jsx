import React, { useRef, useEffect } from 'react'
import './FileUploadSelector.css'

const FileUploadSelector = ({ 
  uploadType,
  setUploadType,
  handleTranscriptFileUpload, 
  handleRecordingUpload,
  isSummarizing,
  isTranscribing 
}) => {
  const fileInputRef = useRef(null)

  // Auto-trigger file input when upload type is selected and input is mounted
  useEffect(() => {
    if (uploadType && fileInputRef.current) {
      fileInputRef.current.value = '' // reset file input
      fileInputRef.current.click()
    }
  }, [uploadType])

  // Always render the file input, but set accept/onChange based on uploadType
  // This ensures the input is always in the DOM and the ref is always available
  const fileInput = (
    <input
      key={uploadType || 'none'}
      ref={fileInputRef}
      type="file"
      accept={uploadType === 'transcript' ? '.docx' : uploadType === 'recording' ? '.mp4' : ''}
      onChange={uploadType === 'transcript' ? handleTranscriptFileUpload : uploadType === 'recording' ? handleRecordingUpload : undefined}
      style={{ display: 'none' }}
    />
  )

  // Show upload type selection
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', width: '100%' }}>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 48px 0 rgba(44,98,255,0.18), 0 2px 24px 0 rgba(0,0,0,0.10)', padding: '40px 48px', minWidth: 480, maxWidth: 600, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 32, color: '#222' }}>Upload Meeting Content</h1>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', padding: '0 16px', boxSizing: 'border-box' }}>
          <button 
            onClick={() => setUploadType('transcript')}
            disabled={isSummarizing || isTranscribing}
            style={{
              display: 'flex', alignItems: 'center', gap: 24, width: '100%', minWidth: 0, padding: '24px 20px', borderRadius: 16, border: uploadType === 'transcript' ? '2px solid #6b8afd' : 'none', background: 'linear-gradient(90deg, #e3eafe 0%, #f5f8ff 100%)', boxShadow: uploadType === 'transcript' ? '0 4px 16px rgba(44, 98, 255, 0.10)' : '0 2px 8px rgba(0,0,0,0.03)', cursor: (isSummarizing || isTranscribing) ? 'not-allowed' : 'pointer', transition: 'box-shadow 0.2s, border 0.2s', fontSize: 20, fontWeight: 600, color: '#2a3a5e', outline: 'none', marginBottom: 0, opacity: (isSummarizing || isTranscribing) ? 0.6 : 1
            }}
          >
            {/* Document SVG */}
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#6b8afd', borderRadius: '50%', width: 56, height: 56 }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="14" fill="#6b8afd"/>
                <path d="M8 8h12v12H8z" stroke="#fff" strokeWidth="2"/>
                <path d="M10 12h8M10 16h6" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <span style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#2a3a5e', whiteSpace: 'nowrap' }}>Upload Transcript</div>
              <div style={{ fontWeight: 400, fontSize: 16, color: '#5a6a8a', marginTop: 2 }}>Upload a DOC/DOCX file</div>
            </span>
          </button>
          <button 
            onClick={() => setUploadType('recording')}
            disabled={isSummarizing || isTranscribing}
            style={{
              display: 'flex', alignItems: 'center', gap: 24, width: '100%', minWidth: 0, padding: '24px 20px', borderRadius: 16, border: uploadType === 'recording' ? '2px solid #6b8afd' : 'none', background: 'linear-gradient(90deg, #e3eafe 0%, #f5f8ff 100%)', boxShadow: uploadType === 'recording' ? '0 4px 16px rgba(44, 98, 255, 0.10)' : '0 2px 8px rgba(0,0,0,0.03)', cursor: (isSummarizing || isTranscribing) ? 'not-allowed' : 'pointer', transition: 'box-shadow 0.2s, border 0.2s', fontSize: 20, fontWeight: 600, color: '#2a3a5e', outline: 'none', marginBottom: 0, opacity: (isSummarizing || isTranscribing) ? 0.6 : 1
            }}
          >
            {/* Video/Microphone SVG */}
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#6b8afd', borderRadius: '50%', width: 56, height: 56 }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="14" cy="14" r="14" fill="#6b8afd"/>
                <path d="M12 8v6a2 2 0 004 0V8a2 2 0 00-4 0z" stroke="#fff" strokeWidth="2"/>
                <path d="M8 12h2M18 12h2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
                <path d="M14 18v2" stroke="#fff" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </span>
            <span style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
              <div style={{ fontWeight: 700, fontSize: 18, color: '#2a3a5e', whiteSpace: 'nowrap' }}>Upload Recording</div>
              <div style={{ fontWeight: 400, fontSize: 16, color: '#5a6a8a', marginTop: 2 }}>Upload an MP4 file</div>
            </span>
          </button>
          {(isSummarizing || isTranscribing) && (
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: 12, 
              padding: '16px', 
              background: '#f0f8ff', 
              borderRadius: 8, 
              border: '1px solid #b3d9ff',
              color: '#0066cc',
              fontSize: 16
            }}>
              <span className="loading-indicator">
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
              </span>
              {isTranscribing ? 'Transcribing audio...' : 'Processing file...'}
            </div>
          )}
        </div>
      </div>
      {fileInput}
    </div>
  )
}

export default FileUploadSelector 