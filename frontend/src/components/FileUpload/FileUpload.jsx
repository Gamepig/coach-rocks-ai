import React, { useState } from 'react'
import './FileUpload.css'

const FileUpload = ({ 
  selectedFile, 
  fileContent, 
  isSummarizing, 
  isTranscribing,
  transcriptionError,
  handleBack, 
  summarizeText 
}) => {
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isStartingAnalysis, setIsStartingAnalysis] = useState(false)

  // Email validation
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // Handle email input change
  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    if (emailError) setEmailError('')
  }

  // Handle form submission and start analysis
  const handleStartAnalysis = async (e) => {
    e.preventDefault()
    
    if (!email.trim()) {
      setEmailError('Email is required')
      return
    }
    
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address')
      return
    }

    setEmailError('')
    setIsStartingAnalysis(true)
    
    try {
      console.log('Starting analysis for email:', email)
      // Start analysis with email
      await summarizeText(fileContent, email)
    } catch (error) {
      console.error('Error starting analysis:', error)
    } finally {
      setIsStartingAnalysis(false)
    }
  }

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  // Helper function to get file icon
  const getFileIcon = () => {
    if (selectedFile?.type === 'video/mp4') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="2" y="6" width="20" height="12" rx="2" fill="#6b8afd"/>
          <path d="M8 12l5 3V9l-5 3z" fill="white"/>
        </svg>
      )
    } else {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" fill="#6b8afd"/>
          <polyline points="14,2 14,8 20,8" fill="white"/>
          <line x1="8" y1="13" x2="16" y2="13" stroke="white" strokeWidth="2"/>
          <line x1="8" y1="17" x2="13" y2="17" stroke="white" strokeWidth="2"/>
        </svg>
      )
    }
  }
  return (
    <div style={{ position: 'relative', minHeight: '60vh', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/* Back button top left */}
      <button
        className="back-button"
        style={{ position: 'absolute', top: 24, left: 32, zIndex: 10 }}
        onClick={handleBack}
      >
        &#8592; Back
      </button>
      <div style={{ background: '#fff', borderRadius: 20, boxShadow: '0 8px 48px 0 rgba(44,98,255,0.18), 0 2px 24px 0 rgba(0,0,0,0.10)', padding: '40px 48px', minWidth: 480, maxWidth: 600, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', boxSizing: 'border-box' }}>
        
        {/* Main Title */}
        <h1 style={{ 
          fontSize: 28, 
          fontWeight: 700, 
          color: '#2a3a5e', 
          marginBottom: 32,
          textAlign: 'center',
          margin: '0 0 32px 0'
        }}>
          Start Analysis
        </h1>

        {/* Exciting File Display */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          marginBottom: 32,
          padding: '24px',
          background: 'linear-gradient(135deg, #6b8afd 0%, #5a7afc 100%)',
          borderRadius: 16,
          width: '100%',
          boxSizing: 'border-box',
          boxShadow: '0 8px 32px rgba(107, 138, 253, 0.3)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', padding: '8px' }}>
              {getFileIcon()}
            </div>
            <span style={{ fontSize: 18, fontWeight: 600, color: 'white' }}>
              {selectedFile.name}
            </span>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', marginBottom: 12 }}>
            {formatFileSize(selectedFile.size)} • Ready to analyze
          </div>
          <button
            onClick={handleBack}
            style={{
              background: 'rgba(255,255,255,0.15)',
              border: '1px solid rgba(255,255,255,0.3)',
              color: 'white',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.25)'
            }}
            onMouseOut={(e) => {
              e.target.style.background = 'rgba(255,255,255,0.15)'
            }}
          >
            Change File
          </button>
        </div>

        {/* Exciting Description */}
        <div style={{ 
          textAlign: 'center', 
          marginBottom: 24,
          padding: '0 16px'
        }}>
          <p style={{ 
            fontSize: 16, 
            color: '#5a6a8a', 
            lineHeight: 1.5, 
            marginBottom: 0
          }}>
            🚀 Get AI-powered insights, action items, and follow-up content in minutes!
          </p>
        </div>

        {/* Email Input */}
        <form id="analysis-form" onSubmit={handleStartAnalysis} style={{ width: '100%' }}>
          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#2a3a5e',
              marginBottom: 8,
              textAlign: 'center'
            }}>
              Enter your email to get started:
            </label>
            <input
              type="email"
              placeholder="your.email@example.com"
              value={email}
              onChange={handleEmailChange}
              style={{
                width: '100%',
                padding: '18px 20px',
                fontSize: 16,
                border: emailError ? '2px solid #ff6b6b' : '2px solid #e3eafe',
                borderRadius: 12,
                outline: 'none',
                transition: 'all 0.2s',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                textAlign: 'center'
              }}
              onFocus={(e) => {
                if (!emailError) {
                  e.target.style.borderColor = '#6b8afd'
                  e.target.style.boxShadow = '0 0 0 4px rgba(107, 138, 253, 0.15)'
                  e.target.style.transform = 'translateY(-1px)'
                }
              }}
              onBlur={(e) => {
                if (!emailError) {
                  e.target.style.borderColor = '#e3eafe'
                  e.target.style.boxShadow = 'none'
                  e.target.style.transform = 'translateY(0)'
                }
              }}
              disabled={isStartingAnalysis || isSummarizing || isTranscribing}
            />
            {emailError && (
              <span style={{ 
                display: 'block',
                color: '#ff6b6b',
                fontSize: 14,
                marginTop: 8,
                textAlign: 'center'
              }}>
                {emailError}
              </span>
            )}
          </div>
        </form>
        
        {/* Show transcription error if any */}
        {transcriptionError && (
          <div style={{ 
            background: '#fee', 
            border: '1px solid #fcc', 
            borderRadius: 12, 
            padding: 20, 
            marginBottom: 24, 
            color: '#c33',
            fontSize: 16,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <strong>Transcription Error:</strong> {transcriptionError}
          </div>
        )}
        
        {/* Show transcribing state */}
        {isTranscribing && (
          <div style={{ 
            background: '#f0f8ff', 
            border: '1px solid #b3d9ff', 
            borderRadius: 12, 
            padding: 20, 
            marginBottom: 24, 
            color: '#0066cc',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <span className="loading-indicator">
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
              <span className="loading-dot"></span>
            </span>
            Transcribing audio to text...
          </div>
        )}
        
        {/* Cool Radiant Analyze Button */}
        <button
          type="submit"
          form="analysis-form"
          className="upload-button"
          style={{ 
            minWidth: 280,
            width: '100%',
            fontSize: 18, 
            fontWeight: 700, 
            padding: '22px 32px', 
            borderRadius: 16,
            background: (isStartingAnalysis || isSummarizing || isTranscribing || !fileContent || !email.trim()) 
              ? 'linear-gradient(135deg, #ccc 0%, #aaa 100%)'
              : 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 25%, #feca57 50%, #48dbfb 75%, #6c5ce7 100%)',
            backgroundSize: '200% 200%',
            color: 'white',
            border: 'none',
            cursor: (isStartingAnalysis || isSummarizing || isTranscribing || !fileContent || !email.trim()) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            transition: 'all 0.3s ease',
            boxShadow: (isStartingAnalysis || isSummarizing || isTranscribing || !fileContent || !email.trim()) 
              ? 'none' 
              : '0 8px 30px rgba(107, 138, 253, 0.4), 0 0 0 1px rgba(255,255,255,0.2)',
            position: 'relative',
            overflow: 'hidden',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            animation: !(isStartingAnalysis || isSummarizing || isTranscribing || !fileContent || !email.trim()) ? 'rainbow-shift 3s ease-in-out infinite' : 'none'
          }}
          onClick={handleStartAnalysis}
          disabled={isStartingAnalysis || isSummarizing || isTranscribing || !fileContent || !email.trim()}
          onMouseOver={(e) => {
            if (!isStartingAnalysis && !isSummarizing && !isTranscribing && fileContent && email.trim()) {
              e.target.style.transform = 'translateY(-3px) scale(1.02)'
              e.target.style.boxShadow = '0 12px 40px rgba(107, 138, 253, 0.6), 0 0 0 1px rgba(255,255,255,0.3)'
              e.target.style.backgroundPosition = '100% 0'
            }
          }}
          onMouseOut={(e) => {
            if (!isStartingAnalysis && !isSummarizing && !isTranscribing && fileContent && email.trim()) {
              e.target.style.transform = 'translateY(0) scale(1)'
              e.target.style.boxShadow = '0 8px 30px rgba(107, 138, 253, 0.4), 0 0 0 1px rgba(255,255,255,0.2)'
              e.target.style.backgroundPosition = '0% 0'
            }
          }}
        >
          {(isStartingAnalysis || isSummarizing || isTranscribing) ? (
            <>
              <span className="loading-indicator">
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
                <span className="loading-dot"></span>
              </span>
              {isTranscribing ? 'Transcribing Audio...' : isStartingAnalysis ? 'Starting Analysis...' : 'Analyzing Meeting...'}
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" fill="white" stroke="white" strokeWidth="1" strokeLinejoin="round"/>
              </svg>
              Start Analysis
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: '100%',
                height: '100%',
                background: 'radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%)',
                transform: 'translate(-50%, -50%)',
                borderRadius: '16px',
                opacity: 0.7
              }}></div>
            </>
          )}
        </button>
        
        <style>
          {`
            @keyframes rainbow-shift {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
          `}
        </style>
      </div>
    </div>
  )
}

export default FileUpload 