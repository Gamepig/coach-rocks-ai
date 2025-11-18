import { useState, useEffect, useRef } from 'react'
import './MeetingUploadModal.css'

function MeetingUploadModal({
  isOpen,
  onClose,
  onAnalyze,
  clients = [],
  isLoading = false,
  canSubmitAnalysis = true,  // ✅ Phase 2：速率限制
  secondsRemaining = 0  // ✅ Phase 2：倒計時秒數
}) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadType, setUploadType] = useState(null)
  const [selectedClientId, setSelectedClientId] = useState('')
  const [newClientName, setNewClientName] = useState('')
  const [clientOption, setClientOption] = useState('existing') // 'existing' or 'new'
  const [isUploading, setIsUploading] = useState(false)
  const [fileContent, setFileContent] = useState('')
  const [meetingDate, setMeetingDate] = useState('')
  
  // ✅ 修復 BUG-1：使用 useRef 追蹤初始化狀態，避免 clients 變化時重置用戶選擇
  const isInitializedRef = useRef(false)

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null)
      setUploadType(null)
      setSelectedClientId('')
      setNewClientName('')
      setClientOption('existing')
      setIsUploading(false)
      setFileContent('')
      setMeetingDate('')
    }
  }, [isOpen])

  // Initialize meeting date to today
  useEffect(() => {
    if (isOpen) {
      const today = new Date().toLocaleDateString('en-CA')
      setMeetingDate(today)
    }
  }, [isOpen])

  // ✅ 修復 BUG-1：只在 modal 打開時初始化一次，避免 clients 變化時重置用戶選擇
  useEffect(() => {
    // 只在 modal 打開且未初始化時設置默認值
    if (isOpen && !isInitializedRef.current) {
      if (clients.length === 0) {
        setClientOption('new')
      } else {
        setClientOption('existing')
        setSelectedClientId(clients[0]?.client_id || '')
      }
      isInitializedRef.current = true
      console.log('✅ MeetingUploadModal: Initialized client option based on clients:', {
        clientsCount: clients.length,
        defaultOption: clients.length === 0 ? 'new' : 'existing',
        selectedClientId: clients[0]?.client_id || 'none'
      })
    }
    
    // Modal 關閉時重置初始化標記
    if (!isOpen) {
      isInitializedRef.current = false
      console.log('✅ MeetingUploadModal: Reset initialization flag (modal closed)')
    }
  }, [isOpen, clients]) // ✅ 保留 clients 依賴以在初始化時獲取最新數據，但只在未初始化時執行

  const handleFileSelect = async (file, type) => {
    // Validate file size (1GB limit)
    const MAX_FILE_SIZE = 1024 * 1024 * 1024 // 1GB in bytes
    if (file.size > MAX_FILE_SIZE) {
      alert(`File size exceeds 1GB limit. Your file is ${(file.size / 1024 / 1024 / 1024).toFixed(2)}GB.`)
      return
    }

    setSelectedFile(file)
    setUploadType(type)
    setIsUploading(true)

    try {
      if (type === 'document') {
        // Handle document upload (DOCX)
        const mammoth = await import('mammoth')
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.extractRawText({ arrayBuffer })
        setFileContent(result.value)
      } else if (type === 'recording') {
        // Handle MP4 recording upload
        // For now, we'll just store the file and let the backend handle transcription
        setFileContent('MP4_FILE_CONTENT') // Placeholder
      }
    } catch (error) {
      console.error('Error processing file:', error)
      alert('Error processing file. Please try again.')
      setSelectedFile(null)
      setUploadType(null)
    } finally {
      setIsUploading(false)
    }
  }

  const handleAnalyze = () => {
    // ✅ 完整輸入驗證：確保所有必填欄位都正確填寫

    // 1. 檔案驗證
    if (!selectedFile) {
      alert('❌ 請先選擇檔案\n\nPlease select a file first')
      return
    }

    // 2. 客戶選擇驗證（Existing Client）
    if (clientOption === 'existing' && !selectedClientId) {
      alert('❌ 請選擇客戶\n\nPlease select a client')
      return
    }

    // 3. 新客戶名稱驗證
    if (clientOption === 'new' && !newClientName.trim()) {
      alert('❌ 請輸入客戶名稱\n\nPlease enter a client name')
      // 聚焦到名稱輸入欄
      document.getElementById('new-client-name')?.focus()
      return
    }

    // 4. 會議日期驗證
    if (!meetingDate) {
      alert('❌ 請選擇會議日期\n\nPlease select a meeting date')
      // 聚焦到日期輸入欄
      document.getElementById('meeting-date')?.focus()
      return
    }

    // ✅ 所有驗證通過，準備分析數據
    const analysisData = {
      file: selectedFile,
      fileContent,
      uploadType,
      clientOption,
      clientId: clientOption === 'existing' ? selectedClientId : null,
      clientName: clientOption === 'new' ? newClientName.trim() : null,
      meetingDate: meetingDate
    }

    console.log('✅ Validation passed, submitting analysis:', {
      clientOption,
      clientName: analysisData.clientName,
      meetingDate: analysisData.meetingDate,
      fileName: selectedFile.name
    })

    onAnalyze(analysisData)
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="meeting-upload-modal">
        <div className="modal-header">
          <h2>📄 Analyze Meeting</h2>
          <p>Upload your meeting file and select a client to get started</p>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          {/* Step 1: File Upload Type Selection */}
          {!uploadType && (
            <div className="upload-type-selection">
              <h3>Choose upload type:</h3>
              <p className="upload-help-text">
                Recommended: Meetings under 60 minutes • Maximum file size: 1GB
              </p>
              <div className="upload-options">
                <label className="upload-option">
                  <input
                    type="radio"
                    name="uploadType"
                    value="document"
                    onChange={() => {}}
                  />
                  <div className="option-content">
                    <div className="option-icon">📄</div>
                    <h4>Upload Document</h4>
                    <p>Upload a DOCX file with meeting transcript</p>
                    <input
                      type="file"
                      accept=".docx"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleFileSelect(e.target.files[0], 'document')
                        }
                      }}
                      style={{ marginTop: '12px' }}
                    />
                  </div>
                </label>

                <label className="upload-option">
                  <input
                    type="radio"
                    name="uploadType"
                    value="recording"
                    onChange={() => {}}
                  />
                  <div className="option-content">
                    <div className="option-icon">🎥</div>
                    <h4>Upload Recording</h4>
                    <p>Upload an MP4 recording to transcribe</p>
                    <input
                      type="file"
                      accept=".mp4"
                      onChange={(e) => {
                        if (e.target.files[0]) {
                          handleFileSelect(e.target.files[0], 'recording')
                        }
                      }}
                      style={{ marginTop: '12px' }}
                    />
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Step 2: File Processing */}
          {isUploading && (
            <div className="file-processing">
              <div className="loading-spinner"></div>
              <h3>Processing file...</h3>
              <p>Please wait while we prepare your {uploadType === 'document' ? 'document' : 'recording'}</p>
            </div>
          )}

          {/* Step 3: Client Selection & Analysis */}
          {selectedFile && !isUploading && (
            <div className="client-selection-step">
              <div className="file-selected">
                <div className="file-info">
                  <div className="file-icon">
                    {uploadType === 'document' ? '📄' : '🎥'}
                  </div>
                  <div className="file-details">
                    <h4>{selectedFile.name}</h4>
                    <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {uploadType}</p>
                  </div>
                  <button 
                    className="change-file-btn"
                    onClick={() => {
                      setSelectedFile(null)
                      setUploadType(null)
                      setFileContent('')
                    }}
                  >
                    Change File
                  </button>
                </div>
              </div>

              <div className="client-selection">
                <h3>Select Client</h3>
                
                <div className="client-options">
                  {clients.length > 0 && (
                    <label className={`client-option ${clientOption === 'existing' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="clientOption"
                        value="existing"
                        checked={clientOption === 'existing'}
                        onChange={(e) => setClientOption(e.target.value)}
                      />
                      <div className="option-content">
                        <div className="option-icon">👤</div>
                        <h4>Existing Client</h4>
                        <p>Assign to one of your existing clients</p>
                      </div>
                    </label>
                  )}

                  <label className={`client-option ${clientOption === 'new' ? 'selected' : ''}`}>
                    <input
                      type="radio"
                      name="clientOption"
                      value="new"
                      checked={clientOption === 'new'}
                      onChange={(e) => setClientOption(e.target.value)}
                    />
                    <div className="option-content">
                      <div className="option-icon">➕</div>
                      <h4>New Client</h4>
                      <p>Create a new client profile</p>
                    </div>
                  </label>
                </div>

                {/* Client Selection Controls */}
                {clientOption === 'existing' && clients.length > 0 && (
                  <div className="client-dropdown">
                    <label htmlFor="client-select">Select Client:</label>
                    <select
                      id="client-select"
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="client-select"
                    >
                      <option value="">Choose a client...</option>
                      {clients.map(client => (
                        <option key={client.client_id} value={client.client_id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {clientOption === 'new' && (
                  <div className="new-client-input">
                    <label htmlFor="new-client-name">Client Name:</label>
                    <input
                      id="new-client-name"
                      type="text"
                      placeholder="Enter client name"
                      value={newClientName}
                      onChange={(e) => setNewClientName(e.target.value)}
                      className="client-name-input"
                    />
                  </div>
                )}

                <div className="meeting-date-selection">
                  <label htmlFor="meeting-date">Meeting Date:</label>
                  <input
                    id="meeting-date"
                    type="date"
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="meeting-date-input"
                  />
                  <p className="date-help-text">Select the date when the meeting occurred</p>
                </div>
              </div>

              <div className="analyze-section">
                <button
                  className={`analyze-btn ${!canSubmitAnalysis ? 'analyze-btn--disabled' : ''}`}
                  onClick={handleAnalyze}
                  disabled={
                    isLoading ||
                    !canSubmitAnalysis ||
                    (clientOption === 'existing' && !selectedClientId) ||
                    (clientOption === 'new' && !newClientName.trim())
                  }
                  title={!canSubmitAnalysis ? `Please wait ${secondsRemaining}s before analyzing another meeting` : ''}
                >
                  {isLoading ? 'Starting Analysis...' : !canSubmitAnalysis ? `⏳ Wait ${secondsRemaining}s...` : '🚀 Analyze Meeting'}
                </button>
                {!canSubmitAnalysis && (
                  <p className="rate-limit-message">
                    ⏱️ Please wait {secondsRemaining} seconds before submitting another analysis
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Starting analysis...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default MeetingUploadModal