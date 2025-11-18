/**
 * Login Form Component
 * 
 * Simple, clean login form for email/password authentication
 */

import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import './AuthForms.css'

export default function LoginForm({ onSwitchToRegister, onCancel }) {
  const { login, error, isAuthenticating, clearError } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localError, setLocalError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLocalError('')
    clearError()

    if (!email || !password) {
      setLocalError('Please enter both email and password')
      return
    }

    try {
      await login(email, password)
      // Success - AuthContext will handle state update
    } catch (error) {
      setLocalError(error.message || 'Login failed')
    }
  }

  const displayError = localError || error

  return (
    <>
      <h3>🔐 Sign In</h3>
      <p>Please sign in to access your coaching data.</p>

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
            placeholder="Enter your password"
            required
            disabled={isAuthenticating}
            autoComplete="current-password"
            minLength={6}
          />
        </div>

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
            disabled={isAuthenticating || !email || !password}
            className="btn-primary"
          >
            {isAuthenticating ? 'Signing In...' : 'Sign In'}
          </button>
        </div>
      </form>

      {onSwitchToRegister && (
        <div className="auth-switch">
          <button
            onClick={onSwitchToRegister}
            className="btn-link"
            disabled={isAuthenticating}
          >
            Don't have an account? Register
          </button>
        </div>
      )}
    </>
  )
}

