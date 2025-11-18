import { useState } from 'react'

export default function MeetingRecordingLink({ provider, url, access, availableAt, onRetry }) {
  const [copied, setCopied] = useState(false)

  const accessLabel = (v) => {
    if (v === 'share_link') return '可分享連結'
    if (v === 'login_required') return '需登入查看'
    if (v === 'owner_only') return '僅擁有者可見'
    if (v === 'domain') return '同網域可見'
    if (v === 'link') return '持連結者可見'
    return '未知權限'
  }

  const providerLabel = provider === 'zoom' ? 'Zoom 錄影' : provider === 'google' ? 'Google 錄影' : '錄影'

  const handleCopy = async () => {
    if (!url) return
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {}
  }

  if (!url) {
    return (
      <div data-testid="recording-link-unavailable" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <span>錄影連結尚未可用，會議結束後數分鐘內產生</span>
        {onRetry ? (
          <button type="button" data-testid="retry-button" onClick={onRetry}>重試</button>
        ) : null}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <span>{providerLabel}</span>
      <a href={url} target="_blank" rel="noopener noreferrer" data-testid="recording-link">開啟錄影</a>
      <span data-testid="access-badge" style={{ padding: '2px 6px', border: '1px solid #ccc', borderRadius: 4 }}>{accessLabel(access)}</span>
      <button type="button" onClick={handleCopy} data-testid="copy-button">{copied ? '已複製' : '複製連結'}</button>
      {availableAt ? <span style={{ color: '#666' }}>{new Date(availableAt).toLocaleString()}</span> : null}
    </div>
  )
}

