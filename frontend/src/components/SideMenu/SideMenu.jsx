import React from 'react'
import './SideMenu.css'

const SideMenu = ({ 
  clientName, 
  meetingTitle, 
  menuItems, 
  selectedMenu, 
  handleMenuClick 
}) => {
  return (
    <div style={{ minWidth: 340, maxWidth: 400, flex: '0 0 340px', paddingRight: 48, borderRight: '1px solid #f0f2f5', display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 8, color: '#222', textAlign: 'left' }}>
        Client {clientName}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, marginBottom: 32, color: '#222', textAlign: 'left' }}>{meetingTitle}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {menuItems.map((item, idx) => (
          <button
            key={item.key}
            onClick={() => handleMenuClick(item.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              background: selectedMenu === item.key ? '#2563eb' : 'none',
              color: selectedMenu === item.key ? '#fff' : '#2563eb',
              fontWeight: 500,
              fontSize: 18,
              border: 'none',
              borderRadius: 10,
              padding: '14px 24px',
              marginBottom: 16,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.2s, color 0.2s',
            }}
          >
            <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
            {/* Right arrow SVG */}
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ marginLeft: 12 }}>
              <path d="M7 5l4 4-4 4" stroke={selectedMenu === item.key ? '#fff' : '#2563eb'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        ))}
      </div>
    </div>
  )
}

export default SideMenu 