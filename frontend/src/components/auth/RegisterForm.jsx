/**
 * Register Form Component
 * 
 * Simple, clean registration form for email/password authentication
 */

import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './AuthForms.css'

export default function RegisterForm({ onSwitchToLogin, onCancel }) {
  const { register, error, isAuthenticating, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [localError, setLocalError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    clearError()

    if (!email || !password || !confirmPassword) {
      setLocalError('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters')
      return
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match')
      return
    }

    try {
      await register(email, password)
      // Success - show success message
      setLocalError('')
      setSuccessMessage('Registration successful! Please verify your email.')
      // Auto-switch to login after 2 seconds
      setTimeout(() => {
        if (onSwitchToLogin) {
          onSwitchToLogin()
        }
      }, 2000)
    } catch (error) {
      setSuccessMessage('')
      setLocalError(error.message || 'Registration failed')
    }
  }

  const displayError = localError || error

  return (
    <>
      <h3>📝 Register</h3>
      <p>Create your account to get started.</p>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            disabled={isAuthenticating}
            autoComplete="email"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password (min 6 characters)"
            required
            disabled={isAuthenticating}
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirmPassword">Confirm Password:</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
            disabled={isAuthenticating}
            autoComplete="new-password"
            minLength={6}
          />
        </div>

        {successMessage && (
          <div className="success-message" role="alert" aria-live="polite">
            <strong>✅ Success:</strong> {successMessage}
          </div>
        )}
        {displayError && (
          <div className="error-message" role="alert" aria-live="polite">
            <strong>⚠️ Error:</strong> {displayError}
          </div>
        )}

        <div className="form-actions">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={isAuthenticating}
              className="btn-secondary"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={isAuthenticating || !email || !password || !confirmPassword}
            className="btn-primary"
          >
            {isAuthenticating ? 'Registering...' : 'Register'}
          </button>
        </div>
      </form>

      {onSwitchToLogin && (
        <div className="auth-switch">
          <button
            onClick={onSwitchToLogin}
            className="btn-link"
            disabled={isAuthenticating}
          >
            Already have an account? Sign In
          </button>
        </div>
      )}
    </>
  )
}

