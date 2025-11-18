import { useState, useEffect } from 'react'
import './ClientSelectionModal.css'

function ClientSelectionModal({ 
  isOpen, 
  onClose, 
  onClientSelected, 
  existingClients = [], 
  isLoading = false,
  verificationData = null 
}) {
  const [selectedOption, setSelectedOption] = useState('')
  const [selectedClientId, setSelectedClientId] = useState('')
  const [newClientName, setNewClientName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Pre-fill client name if available from analysis
  useEffect(() => {
    if (verificationData?.meetingData?.client_name && verificationData.meetingData.client_name !== 'New Client') {
      setNewClientName(verificationData.meetingData.client_name)
    }
  }, [verificationData])

  const handleSubmit = async () => {
    if (!selectedOption) return

    setIsSubmitting(true)
    
    try {
      if (selectedOption === 'new') {
        if (!newClientName.trim()) {
          alert('Please enter a client name')
          setIsSubmitting(false)
          return
        }
        await onClientSelected({
          type: 'new',
          clientName: newClientName.trim(),
          verificationData
        })
      } else if (selectedOption === 'existing') {
        if (!selectedClientId) {
          alert('Please select an existing client')
          setIsSubmitting(false)
          return
        }
        await onClientSelected({
          type: 'existing',
          clientId: selectedClientId,
          verificationData
        })
      }
    } catch (error) {
      console.error('Error selecting client:', error)
      alert('Failed to select client. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="modal-overlay">
      <div className="client-selection-modal">
        <div className="modal-header">
          <h2>🎉 Analysis Complete!</h2>
          <p>Choose how to organize this meeting analysis:</p>
        </div>

        <div className="modal-content">
          {/* Analysis info */}
          {verificationData?.meetingData && (
            <div className="analysis-info">
              <div className="info-card">
                <h3>Meeting Analysis Ready</h3>
                {verificationData.meetingData.client_name && verificationData.meetingData.client_name !== 'New Client' && (
                  <p><strong>Client:</strong> {verificationData.meetingData.client_name}</p>
                )}
                <p><strong>Status:</strong> {verificationData.meetingData.status}</p>
              </div>
            </div>
          )}

          {/* Client selection options */}
          <div className="client-options">
            <div className="option-group">
              <label className={`option-card ${selectedOption === 'new' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="clientOption"
                  value="new"
                  checked={selectedOption === 'new'}
                  onChange={(e) => setSelectedOption(e.target.value)}
                />
                <div className="option-content">
                  <div className="option-icon">👤</div>
                  <h3>Create New Client</h3>
                  <p>Start a new client profile for this analysis</p>
                </div>
              </label>

              {selectedOption === 'new' && (
                <div className="sub-option">
                  <input
                    type="text"
                    placeholder="Enter client name"
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="client-name-input"
                    autoFocus
                  />
                </div>
              )}
            </div>

            {existingClients.length > 0 && (
              <div className="option-group">
                <label className={`option-card ${selectedOption === 'existing' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="clientOption"
                    value="existing"
                    checked={selectedOption === 'existing'}
                    onChange={(e) => setSelectedOption(e.target.value)}
                  />
                  <div className="option-content">
                    <div className="option-icon">📁</div>
                    <h3>Add to Existing Client</h3>
                    <p>Associate this analysis with an existing client</p>
                  </div>
                </label>

                {selectedOption === 'existing' && (
                  <div className="sub-option">
                    <select
                      value={selectedClientId}
                      onChange={(e) => setSelectedClientId(e.target.value)}
                      className="client-select"
                    >
                      <option value="">Select a client...</option>
                      {existingClients.map(client => (
                        <option key={client.client_id} value={client.client_id}>
                          {client.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button 
            onClick={onClose} 
            className="btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit}
            className="btn-primary"
            disabled={!selectedOption || isSubmitting}
          >
            {isSubmitting ? 'Processing...' : 'Continue to Results'}
          </button>
        </div>

        {isLoading && (
          <div className="loading-overlay">
            <div className="loading-spinner"></div>
            <p>Loading your clients...</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ClientSelectionModal