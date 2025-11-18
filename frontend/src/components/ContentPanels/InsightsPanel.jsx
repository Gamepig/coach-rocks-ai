import React from 'react'

const InsightsPanel = ({ painPoint, goal, coachSuggestion, downloadSummary }) => {
  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 32, fontWeight: 700, color: '#222' }}>Insights</div>
        <button onClick={downloadSummary}>Download</button>
      </div>
      {painPoint && (
        <div style={{ fontSize: 20, marginBottom: 16 }}>
          <strong>Pain Points:</strong>
          <ul style={{ margin: '8px 0 0 24px', padding: 0 }}>
            {painPoint.split(/(?:^|[;•])\s*|\s*\u2022\s*|\s*-\s+/).map((item, idx) => {
              let text = item.trim();
              text = text.replace(/^\-\s?/, '');
              return text ? <li key={idx} style={{ marginBottom: 6 }}>{text}</li> : null;
            })}
          </ul>
        </div>
      )}
      {goal && (
        <div style={{ fontSize: 20, marginBottom: 16 }}>
          <strong>Goals:</strong>
          <ul style={{ margin: '8px 0 0 24px', padding: 0 }}>
            {goal.split(/(?:^|[;•])\s*|\s*\u2022\s*|\s*-\s+/).map((item, idx) => {
              let text = item.trim();
              text = text.replace(/^\-\s?/, '');
              return text ? <li key={idx} style={{ marginBottom: 6 }}>{text}</li> : null;
            })}
          </ul>
        </div>
      )}
      {coachSuggestion && (
        <div style={{ fontSize: 20, marginBottom: 16 }}>
          <strong>Suggestions:</strong>
          <ul style={{ margin: '8px 0 0 24px', padding: 0 }}>
            {coachSuggestion.split(/(?:^|[;•])\s*|\s*\u2022\s*|\s*-\s+/).map((item, idx) => {
              let text = item.trim();
              text = text.replace(/^\-\s?/, '');
              return text ? <li key={idx} style={{ marginBottom: 6 }}>{text}</li> : null;
            })}
          </ul>
        </div>
      )}
    </>
  )
}

export default InsightsPanel 