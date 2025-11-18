import { useState, useEffect } from 'react'
import './AnalysisProgressModal.css'

function AnalysisProgressModal({ 
  isOpen, 
  onClose, 
  onCheckItOut,
  meetingId,
  fileName,
  clientName,
  analysisStatus = 'processing', // 'processing', 'completed', 'failed'
  errorMessage = null // 可選的錯誤訊息
}) {
  const [currentStatus, setCurrentStatus] = useState(analysisStatus)
  const [progress, setProgress] = useState(0)
  const [statusMessage, setStatusMessage] = useState('')

  // Simulate progress updates
  useEffect(() => {
    if (!isOpen || currentStatus !== 'processing') return

    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev // Stop at 90% until real completion
        const newProgress = prev + Math.random() * 15
        return Math.min(newProgress, 90) // ✅ Cap at 90% to prevent 100%+
      })
    }, 1000)

    return () => clearInterval(progressInterval)
  }, [isOpen, currentStatus])

  // Update status when prop changes
  useEffect(() => {
    setCurrentStatus(analysisStatus)
    if (analysisStatus === 'completed') {
      setProgress(100)
      setStatusMessage('Analysis complete!')
    } else if (analysisStatus === 'failed') {
      setStatusMessage('Analysis failed. Please try again.')
    } else {
      setStatusMessage('Analyzing your meeting...')
    }
  }, [analysisStatus])

  // Status-dependent content
  const getStatusContent = () => {
    switch (currentStatus) {
      case 'processing':
        return {
          icon: '⚡',
          title: '🚀 Analyzing Your Meeting...',
          description: 'AI is extracting insights, action items, and more. This usually takes a few minutes.',
          showProgress: true,
          actions: [
            {
              label: 'OK (Get notified by email)',
              onClick: onClose,
              style: 'secondary'
            }
          ]
        }

      case 'completed':
        return {
          icon: '🎉',
          title: 'Analysis Complete!',
          description: 'Your meeting analysis is ready with insights, action items, coaching suggestions, and more.',
          showProgress: false,
          actions: [
            {
              label: 'Check it out',
              onClick: onCheckItOut,
              style: 'primary'
            },
            {
              label: 'Later (Check email)',
              onClick: onClose,
              style: 'secondary'
            }
          ]
        }

      case 'failed':
        return {
          icon: '❌',
          title: 'Analysis Failed',
          description: errorMessage 
            ? `Analysis failed: ${errorMessage}. Please try uploading your meeting again.`
            : 'Something went wrong during the analysis. Please try uploading your meeting again.',
          showProgress: false,
          actions: [
            {
              label: 'Try Again',
              onClick: onClose,
              style: 'primary'
            }
          ]
        }

      default:
        return {
          icon: '⚡',
          title: 'Processing...',
          description: 'Please wait while we process your meeting.',
          showProgress: true,
          actions: []
        }
    }
  }

  if (!isOpen) return null

  const content = getStatusContent()

  return (
    <div className="modal-overlay">
      <div className="analysis-progress-modal">
        <div className="modal-content">
          {/* Status Icon */}
          <div className="status-icon">
            {content.icon}
          </div>

          {/* Title */}
          <h2 className="status-title">{content.title}</h2>

          {/* Meeting Info */}
          <div className="meeting-info">
            <h3>{fileName}</h3>
            {clientName && <p>Client: {clientName}</p>}
          </div>

          {/* Progress Bar */}
          {content.showProgress && (
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="progress-text">
                {Math.round(progress)}% • {statusMessage}
              </p>
            </div>
          )}

          {/* Description */}
          <p className="status-description">{content.description}</p>

          {/* Processing Steps (only show during processing) */}
          {currentStatus === 'processing' && (
            <div className="processing-steps">
              <div className="step">
                <div className="step-icon">🔍</div>
                <span>Analyzing content structure</span>
              </div>
              <div className="step">
                <div className="step-icon">🤖</div>
                <span>Extracting insights with AI</span>
              </div>
              <div className="step">
                <div className="step-icon">📝</div>
                <span>Generating action items</span>
              </div>
              <div className="step">
                <div className="step-icon">✨</div>
                <span>Creating coaching suggestions</span>
              </div>
            </div>
          )}

          {/* Completion Highlights (only show when completed) */}
          {currentStatus === 'completed' && (
            <div className="completion-highlights">
              <div className="highlight-grid">
                <div className="highlight-item">
                  <div className="highlight-icon">💡</div>
                  <span>Client Insights</span>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon">✅</div>
                  <span>Action Items</span>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon">🎯</div>
                  <span>Coaching Tips</span>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon">📧</div>
                  <span>Follow-up Email</span>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon">🎬</div>
                  <span>Social Content</span>
                </div>
                <div className="highlight-item">
                  <div className="highlight-icon">🗺️</div>
                  <span>Mind Map</span>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            {content.actions.map((action, index) => (
              <button
                key={index}
                className={`action-btn ${action.style}`}
                onClick={action.onClick}
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* Email Notification Note */}
          {currentStatus === 'processing' && (
            <div className="notification-note">
              <div className="note-icon">📧</div>
              <p>You'll receive an email notification when your analysis is complete, even if you close this window.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default AnalysisProgressModal