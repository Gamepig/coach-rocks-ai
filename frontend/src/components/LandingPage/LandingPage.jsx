import React, { useState, useRef, useEffect } from 'react'
import './LandingPage.css'

const LandingPage = ({ onGetStarted, isAuthenticated, currentUser, onLogout }) => {
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

  const displayName = currentUser?.name || currentUser?.email || 'User'
  const displayEmail = currentUser?.email || ''
  const avatarUrl = currentUser?.avatar_url

  return (
    <div className="landing-page">
      <div className="landing-container">
        {/* Header */}
        <header className="landing-header">
          <div className="logo-section">
            <h1 className="logo-text">CoachRocks AI</h1>
          </div>
          {isAuthenticated && currentUser ? (
            <div className="landing-user-menu" ref={dropdownRef}>
              <button
                className="landing-user-button"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="User menu"
              >
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="landing-avatar"
                  />
                ) : (
                  <div className="landing-avatar-placeholder">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="landing-username">{displayName}</span>
                <svg
                  className={`landing-dropdown-icon ${showDropdown ? 'open' : ''}`}
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
                <div className="landing-dropdown">
                  <div className="landing-dropdown-header">
                    <div className="landing-dropdown-name">{displayName}</div>
                    {displayEmail && (
                      <div className="landing-dropdown-email">{displayEmail}</div>
                    )}
                  </div>
                  <div className="landing-dropdown-divider"></div>
                  <button
                    className="landing-dropdown-item"
                    onClick={() => {
                      setShowDropdown(false)
                      if (onLogout) onLogout()
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
          ) : (
            <button className="btn-login-header" onClick={onGetStarted}>
              登入
            </button>
          )}
        </header>

        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1 className="hero-title">
              智慧教練助手
              <span className="highlight"> AI 驅動</span>
            </h1>
            <p className="hero-subtitle">
              自動分析會議內容，生成專業摘要、行動項目與教練建議
            </p>
            <div className="hero-features">
              <div className="feature-item">
                <div className="feature-icon">📊</div>
                <div className="feature-text">會議分析</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">💡</div>
                <div className="feature-text">智慧建議</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">📝</div>
                <div className="feature-text">行動項目</div>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🎯</div>
                <div className="feature-text">目標追蹤</div>
              </div>
            </div>
            <button className="btn-primary-large" onClick={onGetStarted}>
              開始使用
            </button>
          </div>
        </section>

        {/* Features Section */}
        <section className="features-section">
          <h2 className="section-title">主要功能</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-card-icon">🎙️</div>
              <h3>會議記錄分析</h3>
              <p>自動轉錄並分析會議內容，提取關鍵資訊與洞察</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">📈</div>
              <h3>數據儀表板</h3>
              <p>視覺化呈現客戶數據、會議統計與進度追蹤</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">🤖</div>
              <h3>AI 教練建議</h3>
              <p>基於會議內容提供個人化的教練建議與策略</p>
            </div>
            <div className="feature-card">
              <div className="feature-card-icon">📋</div>
              <h3>行動項目管理</h3>
              <p>自動生成並追蹤客戶與教練的行動項目</p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="cta-section">
          <h2 className="cta-title">準備好開始了嗎？</h2>
          <p className="cta-subtitle">立即登入，體驗 AI 驅動的教練助手</p>
          <button className="btn-primary-large" onClick={onGetStarted}>
            立即開始
          </button>
        </section>

        {/* Footer */}
        <footer className="landing-footer">
          <p>&copy; 2025 CoachRocks AI. All rights reserved.</p>
        </footer>
      </div>
    </div>
  )
}

export default LandingPage

