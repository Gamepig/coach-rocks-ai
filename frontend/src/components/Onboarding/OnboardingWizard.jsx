import React, { useState } from 'react'
import Integrations from '../Settings/Integrations'
import './OnboardingWizard.css'

const OnboardingWizard = ({ user, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
      setError(null)
    }
  }

  const handlePrev = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setError(null)
    }
  }

  const handleComplete = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/users/complete-onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to complete onboarding')
      }

      const data = await response.json()
      console.log('✅ Onboarding completed:', data)

      // Call the onComplete callback to navigate to main app
      if (onComplete) {
        onComplete()
      }
    } catch (err) {
      console.error('❌ Error completing onboarding:', err)
      setError('Failed to complete onboarding. Please try again.')
      setLoading(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <WelcomeStep />
      case 2:
        return <IntegrationsStep />
      case 3:
        return <CompletionStep />
      default:
        return <WelcomeStep />
    }
  }

  return (
    <div className="onboarding-wizard">
      <div className="wizard-container">
        <div className="wizard-header">
          <h1>Welcome to CoachRocks AI</h1>
          <p>Let's set up your account in just a few steps</p>
        </div>

        <div className="wizard-progress">
          <div className={`progress-step ${currentStep >= 1 ? 'active' : ''} ${currentStep > 1 ? 'completed' : ''}`}>
            <span>1</span>
            <p>Welcome</p>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 2 ? 'active' : ''} ${currentStep > 2 ? 'completed' : ''}`}>
            <span>2</span>
            <p>Integrations</p>
          </div>
          <div className="progress-line"></div>
          <div className={`progress-step ${currentStep >= 3 ? 'active' : ''} ${currentStep > 3 ? 'completed' : ''}`}>
            <span>3</span>
            <p>Complete</p>
          </div>
        </div>

        <div className="wizard-content">
          {renderStep()}
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="wizard-actions">
          <button
            className="btn-secondary"
            onClick={handlePrev}
            disabled={currentStep === 1 || loading}
          >
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              className="btn-primary"
              onClick={handleNext}
              disabled={loading}
            >
              Next
            </button>
          ) : (
            <button
              className="btn-primary btn-complete"
              onClick={handleComplete}
              disabled={loading}
            >
              {loading ? 'Completing...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const WelcomeStep = () => (
  <div className="step-content welcome-step">
    <div className="welcome-icon">🎯</div>
    <h2>Welcome to CoachRocks AI</h2>
    <p>Your AI-powered coaching assistant that analyzes client meetings and generates actionable insights.</p>

    <div className="features-list">
      <div className="feature">
        <span className="feature-icon">📊</span>
        <div>
          <h3>AI-Powered Analysis</h3>
          <p>Automatically analyze meeting transcripts and extract key insights</p>
        </div>
      </div>
      <div className="feature">
        <span className="feature-icon">🔗</span>
        <div>
          <h3>Platform Integration</h3>
          <p>Connect with Zoom, Google Meet, and other tools you use daily</p>
        </div>
      </div>
      <div className="feature">
        <span className="feature-icon">📈</span>
        <div>
          <h3>Generate Content</h3>
          <p>Create emails, social media content, and coaching plans automatically</p>
        </div>
      </div>
    </div>

    <p className="step-description">
      Let's set up your integrations so CoachRocks can start helping you in the next step.
    </p>
  </div>
)

const IntegrationsStep = () => (
  <div className="step-content integrations-step">
    <h2>Connect Your Platforms</h2>
    <p>Set up integrations to automatically capture your meetings and enhance your coaching workflow.</p>

    <div className="integrations-container">
      <Integrations />
    </div>
  </div>
)

const CompletionStep = () => (
  <div className="step-content completion-step">
    <div className="completion-icon">✨</div>
    <h2>All Set!</h2>
    <p>Your CoachRocks AI account is ready to go.</p>

    <div className="completion-checklist">
      <div className="checklist-item">
        <span className="checkmark">✓</span>
        <p>Account created successfully</p>
      </div>
      <div className="checklist-item">
        <span className="checkmark">✓</span>
        <p>Integrations configured</p>
      </div>
      <div className="checklist-item">
        <span className="checkmark">✓</span>
        <p>Ready to analyze meetings</p>
      </div>
    </div>

    <p className="completion-message">
      Click "Complete Setup" to start using CoachRocks AI and begin analyzing your client meetings!
    </p>
  </div>
)

export default OnboardingWizard
