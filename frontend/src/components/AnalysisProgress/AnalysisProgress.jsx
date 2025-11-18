import React, { useState, useEffect } from 'react'
import './AnalysisProgress.css'

const AnalysisProgress = ({ userEmail, onViewResults, onStartNew }) => {
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [progress, setProgress] = useState(0)

  // Simulate progress for demo - in real app this would be real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) {
          // Keep at 95% until real completion
          return prev
        }
        return prev + Math.random() * 3
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // Mock completion after some time - replace with real completion detection
  useEffect(() => {
    const timer = setTimeout(() => {
      setProgress(100)
      setAnalysisComplete(true)
    }, 8000) // 8 seconds for demo

    return () => clearTimeout(timer)
  }, [])

  const handleViewResults = () => {
    // In the real implementation, this would redirect to magic link page
    onViewResults()
  }

  return (
    <div className="analysis-progress-container">
      <div className="analysis-progress-card">
        {/* Header */}
        <div className="progress-header">
          <div className="status-icon">
            {analysisComplete ? (
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="24" fill="#10b981"/>
                <path d="M16 24l8 8 16-16" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="24" cy="24" r="24" fill="#6b8afd"/>
                <path d="M24 12v12l8 4" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </div>
          <h1 className="progress-title">
            {analysisComplete ? '✅ Analysis Complete!' : '📧 Analysis Started'}
          </h1>
        </div>

        {/* Email confirmation */}
        <div className="email-confirmation">
          <div className="email-info">
            <span className="email-label">📧 Results will be sent to:</span>
            <span className="email-address">{userEmail}</span>
          </div>
        </div>

        {/* Progress section */}
        {!analysisComplete ? (
          <div className="progress-section">
            <div className="progress-status">
              <div className="progress-icon">
                <div className="spinner"></div>
              </div>
              <span className="progress-text">Analyzing your meeting...</span>
            </div>
            
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <span className="progress-percentage">{Math.round(progress)}%</span>
            </div>

            <p className="progress-description">
              Our AI is extracting client insights, action items, coaching advice, and generating follow-up content.
            </p>
          </div>
        ) : (
          <div className="completion-section">
            <div className="completion-message">
              <h2>🎉 Your meeting analysis is ready!</h2>
              <p>All insights, action items, and follow-up content have been generated.</p>
            </div>

            <button 
              className="view-results-button"
              onClick={handleViewResults}
            >
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 3v14m7-7H3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
              View Results Now
            </button>

            <p className="email-sent-note">
              📧 Link also sent to your email
            </p>
          </div>
        )}

        {/* Action buttons */}
        <div className="progress-actions">
          <button 
            className="secondary-button"
            onClick={() => window.close()}
          >
            Close Window
          </button>
          <button 
            className="secondary-button"
            onClick={onStartNew}
          >
            Start New Analysis
          </button>
        </div>
      </div>
    </div>
  )
}

export default AnalysisProgress