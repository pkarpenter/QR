export default function Topbar({ title, subtitle, actions }) {
  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="text-xs text-muted">{subtitle}</div>}
      </div>
      <div className="topbar-right">{actions}</div>
    </header>
  )
}
