export default function KpiCard({ icon, value, label, subtitle, change, changeType, color }) {
  return (
    <div className="kpi-card" style={{ '--kpi-color': color || 'var(--accent)' }}>
      <div className="kpi-icon">{icon}</div>
      <div className="kpi-value">{value ?? <span className="spinner" />}</div>
      <div className="kpi-label">{label}</div>
      {subtitle && <div className="text-xs text-muted" style={{ marginTop: '0.25rem' }}>{subtitle}</div>}
      {change !== undefined && (
        <div className={`kpi-change ${changeType || 'up'}`}>
          {changeType === 'up' ? '↑' : '↓'} {change}
        </div>
      )}
    </div>
  )
}

