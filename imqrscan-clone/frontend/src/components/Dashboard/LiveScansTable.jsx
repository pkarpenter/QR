import { Inbox, Smartphone, Tablet, Monitor } from 'lucide-react'

export default function LiveScansTable({ scans = [] }) {
  if (!scans.length) {
    return (
      <div className="empty-state">
        <div className="empty-icon"><Inbox size={36} color="var(--text-muted)" /></div>
        <div className="empty-title">No scans yet</div>
        <div className="empty-desc">Scans will appear here in real time</div>
      </div>
    )
  }

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th><span className="live-dot" /> &nbsp;Live Feed</th>
            <th>Device</th>
            <th>OS</th>
            <th>Country</th>
            <th>City</th>
            <th>Time</th>
          </tr>
        </thead>
        <tbody>
          {scans.map((s, i) => (
            <tr key={i}>
              <td>
                <span style={{ fontSize: '.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                  {s.qr_id?.slice(0,8)}…
                </span>
              </td>
              <td>
                <span className="flex items-center gap-1.5">
                  {deviceIcon(s.device)}
                  {s.device || '—'}
                </span>
              </td>
              <td>{s.os || '—'}</td>
              <td>{s.country || '—'}</td>
              <td>{s.city || '—'}</td>
              <td className="text-muted text-xs">{formatTime(s.scanned_at)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function deviceIcon(d) {
  if (d === 'Mobile') return <Smartphone size={15} color="var(--accent)" />
  if (d === 'Tablet') return <Tablet size={15} color="var(--accent-2)" />
  return <Monitor size={15} color="var(--accent-cyan)" />
}


function formatTime(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}
