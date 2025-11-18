import React from 'react'

export default function MeetingsTable({ rows, isLoading }) {
  if (isLoading) {
    return <div style={{ padding: 16, color: '#666' }}>Loading meetings...</div>
  }
  if (!rows || rows.length === 0) {
    return <div style={{ padding: 16, color: '#666' }}>No meetings found</div>
  }

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontSize: 24, fontWeight: 700, marginBottom: 12 }}>Meetings</div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                     <thead>
             <tr>
               <th style={th}>Meeting Title</th>
               <th style={th}>Client</th>
               <th style={th}>Uploaded Date</th>
             </tr>
           </thead>
          <tbody>
                         {rows.map((r) => (
               <tr key={r.meeting_id}>
                 <td style={td}>{r.meeting_title || '-'}</td>
                 <td style={td}>{r.client_name || '-'}</td>
                 <td style={td}>{formatDate(r.uploaded_date)}</td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const th = {
  textAlign: 'left',
  padding: '10px 8px',
  borderBottom: '1px solid #e9ecef',
  color: '#666',
  fontWeight: 600,
}

const td = {
  padding: '10px 8px',
  borderBottom: '1px solid #f1f3f5',
  color: '#222',
  verticalAlign: 'top'
}



function formatDate(d) {
  if (!d) return '-'
  const date = new Date(d)
  if (isNaN(date.getTime())) return d
  return date.toLocaleString()
}

