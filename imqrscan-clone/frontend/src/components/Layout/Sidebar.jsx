import { NavLink } from 'react-router-dom'
import { LayoutDashboard, QrCode, Link2, BarChart3, Settings, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const NAV = [
  { to: '/', Icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/qr', Icon: QrCode, label: 'QR Codes' },
  { to: '/links', Icon: Link2, label: 'Links' },
  { to: '/analytics', Icon: BarChart3, label: 'Analytics' },
  { to: '/settings', Icon: Settings, label: 'Settings' },
]

export default function Sidebar({ isOpen = false, onNavigate }) {
  const { user, signOut } = useAuth()

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`}>
      <div className="sidebar-logo flex items-center gap-2.5">
        <img src="/logo.png" alt="IMPRscan" style={{ width: 28, height: 28, objectFit: 'contain' }} />
        <span>IMPR<span style={{ color: 'var(--accent-2)' }}>scan</span></span>
      </div>


      {NAV.map(n => {
        const IconComponent = n.Icon
        return (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.to === '/'}
            className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            onClick={onNavigate}
          >
            <span className="nav-icon"><IconComponent size={18} /></span>
            {n.label}
          </NavLink>
        )
      })}

      <div className="sidebar-spacer" />

      <div className="sidebar-footer">
        <div className="text-xs text-muted" style={{ marginBottom: '.5rem' }}>
          {user?.email}
        </div>
        <button className="btn btn-ghost btn-sm w-full flex items-center justify-center gap-2" onClick={signOut}>
          <LogOut size={15} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}

