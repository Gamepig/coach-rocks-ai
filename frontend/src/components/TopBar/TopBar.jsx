import React, { useState, useRef, useEffect } from 'react'
import './TopBar.css'

const TopBar = ({ currentUser, onLogout, isAuthenticated }) => {
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  if (!isAuthenticated) {
    return null
  }

  // If no currentUser but authenticated, show default user info
  const displayName = currentUser?.name || currentUser?.email || 'User'
  const displayEmail = currentUser?.email || ''
  const avatarUrl = currentUser?.avatar_url

  return (
    <div className="topbar-container">
      <div className="topbar-content">
        <div className="topbar-user" ref={dropdownRef}>
          <button
            className="topbar-user-button"
            onClick={() => setShowDropdown(!showDropdown)}
            aria-label="User menu"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="topbar-avatar"
              />
            ) : (
              <div className="topbar-avatar-placeholder">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="topbar-username">{displayName}</span>
            <svg
              className={`topbar-dropdown-icon ${showDropdown ? 'open' : ''}`}
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
            >
              <path
                d="M2 4L6 8L10 4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {showDropdown && (
            <div className="topbar-dropdown">
              <div className="topbar-dropdown-header">
                <div className="topbar-dropdown-name">{displayName}</div>
                {displayEmail && (
                  <div className="topbar-dropdown-email">{displayEmail}</div>
                )}
              </div>
              <div className="topbar-dropdown-divider"></div>
              <button
                className="topbar-dropdown-item"
                onClick={() => {
                  setShowDropdown(false)
                  onLogout()
                }}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M6 14H3C2.44772 14 2 13.5523 2 13V3C2 2.44772 2.44772 2 3 2H6M10 11L13 8M13 8L10 5M13 8H6"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                登出
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TopBar

