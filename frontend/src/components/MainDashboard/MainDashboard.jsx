import React from 'react'
import { Document, Packer, Paragraph, TextRun } from 'docx'
import SideMenu from '../SideMenu/SideMenu'
import SummaryPanel from '../ContentPanels/SummaryPanel'
import InsightsPanel from '../ContentPanels/InsightsPanel'
import ActionItemsPanel from '../ContentPanels/ActionItemsPanel'
import MindMapPanel from '../ContentPanels/MindMapPanel'
import ResourcesPanel from '../ContentPanels/ResourcesPanel'
import './MainDashboard.css'

const MainDashboard = ({
  // Side menu props
  clientName,
  meetingTitle,
  menuItems,
  selectedMenu,
  handleMenuClick,
  
  // Content panel props
  summary,
  painPoint,
  goal,
  coachSuggestion,
  clientActionItems,
  coachActionItems,
  mindMap,
  isGeneratingMindMap,
  mindMapError,
  mindMapRef,
  
  // Download functions
  downloadSummary,
  downloadClientActionItems,
  downloadCoachActionItems,
  downloadMindMap,
  
  // Other props for remaining panels
  isDiscovery,
  coachingAdvice,
  salesTechniqueAdvice,
  followUpEmail,
  downloadFollowUpEmail,
  reelsScripts,
  downloadReelsScripts,
  nextMeetingPrep,
  isGeneratingNextMeetingPrep,
  generateNextMeetingPrep,
  fontStyle,
  setFontStyle,
  backgroundImage,
  setBackgroundImage,
  colorTheme,
  setColorTheme,
  colorThemeMode,
  setColorThemeMode,
  
  // Resources props
  resourcesList,
  isGeneratingResources,
  resourcesError,
  downloadResourcesList,
  onGenerateResourcesList
}) => {
  const renderContentPanel = () => {
    switch (selectedMenu) {
      case 'Summary':
        return <SummaryPanel summary={summary} downloadSummary={downloadSummary} />
      
      case 'Insights':
        return <InsightsPanel 
          painPoint={painPoint} 
          goal={goal} 
          coachSuggestion={coachSuggestion} 
          downloadSummary={downloadSummary} 
        />
      
      case 'ActionClient':
        return <ActionItemsPanel 
          type="client" 
          actionItems={clientActionItems} 
          downloadActionItems={downloadClientActionItems} 
        />
      
      case 'ActionCoach':
        return <ActionItemsPanel 
          type="coach" 
          actionItems={coachActionItems} 
          downloadActionItems={downloadCoachActionItems} 
        />
      
      case 'ResourcesList':
        return <ResourcesPanel 
          resourcesList={resourcesList} 
          downloadResourcesList={downloadResourcesList}
          onGenerateResourcesList={onGenerateResourcesList}
          isGeneratingResources={isGeneratingResources}
          resourcesError={resourcesError}
        />
      
      case 'CoachingAdvice':
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#222' }}>Coaching Advice</div>
              <button onClick={() => {
                const doc = new Document({
                  sections: [{
                    properties: {},
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: coachingAdvice,
                            size: 24,
                          }),
                        ],
                      }),
                    ],
                  }],
                })
                Packer.toBlob(doc).then(blob => {
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'coaching_advice.docx'
                  document.body.appendChild(a)
                  a.click()
                  window.URL.revokeObjectURL(url)
                  document.body.removeChild(a)
                })
              }}>Download</button>
            </div>
            <div style={{ fontSize: 20, color: '#3a4664', lineHeight: 1.7, marginBottom: 32 }}>{coachingAdvice}</div>
          </>
        )
      
      case 'SalesTechniqueAdvice':
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#222' }}>Sales Technique Advice</div>
              <button onClick={() => {
                const doc = new Document({
                  sections: [{
                    properties: {},
                    children: [
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: salesTechniqueAdvice,
                            size: 24,
                          }),
                        ],
                      }),
                    ],
                  }],
                })
                Packer.toBlob(doc).then(blob => {
                  const url = window.URL.createObjectURL(blob)
                  const a = document.createElement('a')
                  a.href = url
                  a.download = 'sales_technique_advice.docx'
                  document.body.appendChild(a)
                  a.click()
                  window.URL.revokeObjectURL(url)
                  document.body.removeChild(a)
                })
              }}>Download</button>
            </div>
            <div style={{ fontSize: 20, color: '#3a4664', lineHeight: 1.7, marginBottom: 32 }}>{salesTechniqueAdvice}</div>
          </>
        )
      
      case 'MindMap':
        return <MindMapPanel 
          mindMap={mindMap} 
          isGeneratingMindMap={isGeneratingMindMap} 
          mindMapError={mindMapError} 
          downloadMindMap={downloadMindMap} 
          mindMapRef={mindMapRef} 
        />
      
      case 'FollowUpEmail':
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#222' }}>Follow-up Email Template</div>
              {followUpEmail && <button onClick={downloadFollowUpEmail}>Download</button>}
            </div>
            <div style={{ fontSize: 20, color: '#3a4664', lineHeight: 1.7, marginBottom: 32 }}>
              {followUpEmail || 'No follow-up email content available. Follow-up email will be generated after summary analysis.'}
            </div>
          </>
        )
      
      case 'ReelsScripts':
        return (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ fontSize: 32, fontWeight: 700, color: '#222' }}>Reels Scripts</div>
              {reelsScripts && <button onClick={downloadReelsScripts}>Download</button>}
            </div>
            
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontSize: 18, color: '#666', marginBottom: 16 }}>
                Here are some engaging reels scripts based on your meeting insights:
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {Array.isArray(reelsScripts) && reelsScripts.length > 0 ? reelsScripts.map((reel, index) => (
                  <div 
                    key={index}
                    style={{
                      background: '#f8f9fa',
                      borderRadius: 12,
                      padding: 20,
                      border: '1px solid #e9ecef',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#666', marginBottom: 4 }}>Hook:</div>
                        <div style={{ fontSize: 16, color: '#222', lineHeight: 1.5 }}>{reel.hook}</div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#666', marginBottom: 4 }}>Narrative:</div>
                        <div style={{ fontSize: 16, color: '#222', lineHeight: 1.5 }}>{reel.narrative}</div>
                      </div>
                      
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#666', marginBottom: 4 }}>Call to Action:</div>
                        <div style={{ fontSize: 16, color: '#222', lineHeight: 1.5 }}>{reel.callToAction}</div>
                      </div>
                      
                      {reel.hashtags && reel.hashtags.length > 0 && (
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: '#666', marginBottom: 4 }}>Hashtags:</div>
                          <div style={{ fontSize: 16, color: '#007bff', lineHeight: 1.5 }}>
                            {reel.hashtags.join(' ')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                    <div style={{ fontSize: 18, marginBottom: 16 }}>No reels scripts available</div>
                    <div style={{ fontSize: 14 }}>Reels scripts will be generated after summary analysis</div>
                  </div>
                )}
              </div>
            </div>
          </>
        )
       
       case 'NextMeetingPrep':
          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#222' }}>Preparation for Next Meeting</div>
              </div>
              
              {nextMeetingPrep ? (
                <div style={{ marginBottom: 32 }}>
                  {nextMeetingPrep.error ? (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#dc3545' }}>
                      <div style={{ fontSize: 18, marginBottom: 16 }}>Error</div>
                      <div style={{ fontSize: 14 }}>{nextMeetingPrep.error}</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                      {/* Quick Overview */}
                      {nextMeetingPrep.quickOverview && (
                        <div 
                          style={{
                            background: '#f8f9fa',
                            borderRadius: 12,
                            padding: 20,
                            border: '1px solid #e9ecef'
                          }}
                        >
                          <div style={{ fontSize: 18, fontWeight: 600, color: '#222', marginBottom: 12 }}>Quick Overview</div>
                          <div style={{ fontSize: 16, color: '#666', lineHeight: 1.6 }}>{nextMeetingPrep.quickOverview}</div>
                        </div>
                      )}
                      
                      {/* Overall Insights */}
                      {nextMeetingPrep.overallInsights && (
                        <div 
                          style={{
                            background: '#f8f9fa',
                            borderRadius: 12,
                            padding: 20,
                            border: '1px solid #e9ecef'
                          }}
                        >
                          <div style={{ fontSize: 18, fontWeight: 600, color: '#222', marginBottom: 16 }}>Overall Insights</div>
                          
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {nextMeetingPrep.overallInsights.overallClientGoals && (
                              <div>
                                <div style={{ fontSize: 16, fontWeight: 600, color: '#666', marginBottom: 8 }}>Client Goals:</div>
                                <div style={{ fontSize: 16, color: '#222', lineHeight: 1.5 }}>{nextMeetingPrep.overallInsights.overallClientGoals}</div>
                              </div>
                            )}

                            {nextMeetingPrep.overallInsights.recurringPainPoints && Array.isArray(nextMeetingPrep.overallInsights.recurringPainPoints) && nextMeetingPrep.overallInsights.recurringPainPoints.length > 0 && (
                              <div>
                                <div style={{ fontSize: 16, fontWeight: 600, color: '#666', marginBottom: 8 }}>Recurring Pain Points:</div>
                                <ul style={{ margin: '8px 0 0 24px', padding: 0 }}>
                                  {nextMeetingPrep.overallInsights.recurringPainPoints.map((point, idx) => (
                                    <li key={idx} style={{ marginBottom: 6, fontSize: 16, color: '#222', lineHeight: 1.5 }}>{point}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {nextMeetingPrep.overallInsights.successfulStrategies && Array.isArray(nextMeetingPrep.overallInsights.successfulStrategies) && nextMeetingPrep.overallInsights.successfulStrategies.length > 0 && (
                              <div>
                                <div style={{ fontSize: 16, fontWeight: 600, color: '#666', marginBottom: 8 }}>Successful Strategies:</div>
                                <ul style={{ margin: '8px 0 0 24px', padding: 0 }}>
                                  {nextMeetingPrep.overallInsights.successfulStrategies.map((strategy, idx) => (
                                    <li key={idx} style={{ marginBottom: 6, fontSize: 16, color: '#222', lineHeight: 1.5 }}>{strategy}</li>
                                  ))}
                                </ul>
                              </div>
                            )}

                            {nextMeetingPrep.overallInsights.areasOfStagnation && Array.isArray(nextMeetingPrep.overallInsights.areasOfStagnation) && nextMeetingPrep.overallInsights.areasOfStagnation.length > 0 && (
                              <div>
                                <div style={{ fontSize: 16, fontWeight: 600, color: '#666', marginBottom: 8 }}>Areas of Stagnation:</div>
                                <ul style={{ margin: '8px 0 0 24px', padding: 0 }}>
                                  {nextMeetingPrep.overallInsights.areasOfStagnation.map((area, idx) => (
                                    <li key={idx} style={{ marginBottom: 6, fontSize: 16, color: '#222', lineHeight: 1.5 }}>{area}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                                             {/* Client Progress Assessment */}
                       {nextMeetingPrep.clientProgressAssessment && (
                         <div 
                           style={{
                             background: '#f8f9fa',
                             borderRadius: 12,
                             padding: 20,
                             border: '1px solid #e9ecef'
                           }}
                         >
                           <div style={{ fontSize: 18, fontWeight: 600, color: '#222', marginBottom: 12 }}>Client Progress Assessment</div>
                           <div style={{ fontSize: 16, color: '#666', lineHeight: 1.6 }}>{nextMeetingPrep.clientProgressAssessment}</div>
                         </div>
                       )}
                       
                       {/* Current Journey Status */}
                       {nextMeetingPrep.currentJourneyStatus && (
                         <div 
                           style={{
                             background: '#f8f9fa',
                             borderRadius: 12,
                             padding: 20,
                             border: '1px solid #e9ecef'
                           }}
                         >
                           <div style={{ fontSize: 18, fontWeight: 600, color: '#222', marginBottom: 12 }}>Current Journey Status</div>
                           <div style={{ fontSize: 16, color: '#666', lineHeight: 1.6 }}>{nextMeetingPrep.currentJourneyStatus}</div>
                         </div>
                       )}
                       
                       {/* Key Areas to Address */}
                       {nextMeetingPrep.keyAreasToAddress && Array.isArray(nextMeetingPrep.keyAreasToAddress) && nextMeetingPrep.keyAreasToAddress.length > 0 && (
                         <div 
                           style={{
                             background: '#f8f9fa',
                             borderRadius: 12,
                             padding: 20,
                             border: '1px solid #e9ecef'
                           }}
                         >
                           <div style={{ fontSize: 18, fontWeight: 600, color: '#222', marginBottom: 12 }}>Key Areas to Address</div>
                           <ul style={{ margin: '8px 0 0 24px', padding: 0 }}>
                             {nextMeetingPrep.keyAreasToAddress.map((area, idx) => (
                               <li key={idx} style={{ marginBottom: 8, fontSize: 16, color: '#222', lineHeight: 1.5 }}>{area}</li>
                             ))}
                           </ul>
                         </div>
                       )}
                       
                       
                      
                      {/* Potential New Discussion Points */}
                      {nextMeetingPrep.potentialNewDiscussionPoints && Array.isArray(nextMeetingPrep.potentialNewDiscussionPoints) && nextMeetingPrep.potentialNewDiscussionPoints.length > 0 && (
                        <div 
                          style={{
                            background: '#f8f9fa',
                            borderRadius: 12,
                            padding: 20,
                            border: '1px solid #e9ecef'
                          }}
                        >
                          <div style={{ fontSize: 18, fontWeight: 600, color: '#222', marginBottom: 12 }}>Potential New Discussion Points</div>
                          <ul style={{ margin: '8px 0 0 24px', padding: 0 }}>
                            {nextMeetingPrep.potentialNewDiscussionPoints.map((point, idx) => (
                              <li key={idx} style={{ marginBottom: 8, fontSize: 16, color: '#222', lineHeight: 1.5 }}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {/* Recommended Mindset */}
                      {nextMeetingPrep.recommendedMindset && (
                        <div 
                          style={{
                            background: '#f8f9fa',
                            borderRadius: 12,
                            padding: 20,
                            border: '1px solid #e9ecef'
                          }}
                        >
                          <div style={{ fontSize: 18, fontWeight: 600, color: '#222', marginBottom: 12 }}>Recommended Approach</div>
                          <div style={{ fontSize: 16, color: '#222', lineHeight: 1.6 }}>{nextMeetingPrep.recommendedMindset}</div>
                        </div>
                      )}
                      
                                             {/* Fallback message if no data is available */}
                       {!nextMeetingPrep.quickOverview && 
                        !nextMeetingPrep.overallInsights && 
                        !nextMeetingPrep.clientProgressAssessment &&
                        !nextMeetingPrep.currentJourneyStatus &&
                        !nextMeetingPrep.keyAreasToAddress && 
                        !nextMeetingPrep.potentialNewDiscussionPoints && 
                        !nextMeetingPrep.recommendedMindset && (
                         <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                           <div style={{ fontSize: 18, marginBottom: 16 }}>No preparation data available</div>
                           <div style={{ fontSize: 14 }}>Preparation data will be generated during summary analysis</div>
                         </div>
                       )}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
                  <div style={{ fontSize: 18, marginBottom: 16 }}>No preparation data available</div>
                  <div style={{ fontSize: 14 }}>Preparation data will be generated during summary analysis</div>
                </div>
              )}
            </>
          )
       
       case 'IGCreative':
        return (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, flex: 1, minWidth: 0, width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, width: '100%' }}>
                <div style={{ fontSize: 32, fontWeight: 700, color: '#222' }}>Generate IG Creative</div>
                <div style={{ width: 120 }}></div> {/* Placeholder for download button space */}
              </div>
              <div style={{ flex: 1 }} />
              {/* Controls at the very bottom */}
              <div style={{ marginTop: 'auto', marginBottom: 24 }}>
                {/* Color Theme Row (separate line) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', marginBottom: 16 }}>
                  <label style={{ fontWeight: 500, marginRight: 4, minWidth: 90 }}>Color Theme:</label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', marginRight: 8 }}>
                    <input
                      type="radio"
                      name="colorThemeMode"
                      value="AI-generated"
                      checked={colorThemeMode === 'AI-generated'}
                      onChange={() => setColorThemeMode('AI-generated')}
                      style={{ marginRight: 4 }}
                    />
                    AI-generated
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', marginRight: 8 }}>
                    <input
                      type="radio"
                      name="colorThemeMode"
                      value="Custom"
                      checked={colorThemeMode === 'Custom'}
                      onChange={() => setColorThemeMode('Custom')}
                      style={{ marginRight: 4 }}
                    />
                    Custom
                    {colorThemeMode === 'Custom' && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                        <input
                          type="color"
                          value={colorTheme}
                          onChange={e => setColorTheme(e.target.value)}
                          style={{ width: 32, height: 24, border: 'none', background: 'none', verticalAlign: 'middle', marginRight: 2 }}
                        />
                        <span style={{ fontSize: 16, color: '#333' }}>
                          RGB: {(() => {
                            const hex = colorTheme.replace('#', '');
                            const bigint = parseInt(hex, 16);
                            const r = (bigint >> 16) & 255;
                            const g = (bigint >> 8) & 255;
                            const b = bigint & 255;
                            return `rgb(${r}, ${g}, ${b})`;
                          })()}
                        </span>
                      </span>
                    )}
                  </label>
                </div>
                {/* Font Style and Background Image Row (same line) */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, width: '100%', marginBottom: 0 }}>
                  {/* Font Style */}
                  <label style={{ fontWeight: 500, marginRight: 4, minWidth: 70 }}>Font Style:</label>
                  <select value={fontStyle} onChange={e => setFontStyle(e.target.value)} style={{ fontSize: 18, padding: '6px 12px', borderRadius: 6, minWidth: 100, maxWidth: 140 }}>
                    <option value="AI-generated">AI-generated</option>
                    <option value="Arial">Arial</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Montserrat">Montserrat</option>
                    <option value="Lobster">Lobster</option>
                  </select>
                  {/* Background Image */}
                  <label style={{ fontWeight: 500, marginRight: 4, minWidth: 90 }}>Background Image:</label>
                  <select value={backgroundImage} onChange={e => setBackgroundImage(e.target.value)} style={{ fontSize: 18, padding: '6px 12px', borderRadius: 6, minWidth: 100, maxWidth: 140 }}>
                    <option value="AI-generated">AI-generated</option>
                    <option value="Abstract">Abstract</option>
                    <option value="Nature">Nature</option>
                    <option value="Gradient">Gradient</option>
                    <option value="Solid">Solid</option>
                  </select>
                </div>
                <button style={{ width: '25%', margin: '24px auto 0 auto', display: 'block', padding: '16px 0', fontSize: 20, fontWeight: 700, borderRadius: 8, background: '#2563eb', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(44,98,255,0.10)' }}>Generate</button>
              </div>
            </div>
          </>
        )
      
      default:
        return <div>Select a menu item</div>
    }
  }

  return (
    <div className="main-dashboard">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '40px 0' }}>
        <div style={{ display: 'flex', flexDirection: 'row', background: '#fff', borderRadius: 24, boxShadow: '0 8px 48px 0 rgba(44,98,255,0.10), 0 2px 24px 0 rgba(0,0,0,0.06)', padding: '48px 56px', maxWidth: 1200, minWidth: 1050, width: '100%', gap: 0, height: '80vh' }}>
          {/* Left menu/info panel */}
          <SideMenu
            clientName={clientName}
            meetingTitle={meetingTitle}
            menuItems={menuItems}
            selectedMenu={selectedMenu}
            handleMenuClick={handleMenuClick}
          />
          {/* Right content panel */}
          <div className="right-panel" style={{ flex: 1, minWidth: 650, flexShrink: 0, paddingLeft: 56, display: 'flex', flexDirection: 'column', gap: 32, textAlign: 'left', minHeight: 0, height: '100%' }}>
            {renderContentPanel()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MainDashboard 