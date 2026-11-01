import { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  QrCode,
  LayoutGrid,
  List,
  Search,
  ChevronDown,
  Globe,
  Sparkles,
  Clock,
  Link2,
  ExternalLink,
  MoreHorizontal,
  TrendingUp,
  Download,
  Copy,
  BarChart2,
  Trash2,
  Plus,
  X,
  Check,
  CheckCircle2,
  Activity,
  Zap,
  Layers,
  ShieldCheck,
  ArrowRight,
  Palette,
  Users,
} from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import {
  getQrCodes,
  createQrCode,
  deleteQrCode,
  toggleQrCode,
  getQrDownloadUrl,
  getDashboardStats,
} from '../lib/api'

export default function Dashboard() {
  const navigate = useNavigate()
  const location = useLocation()
  const isQrListPage = location.pathname.startsWith('/qr')
  const [qrCodes, setQrCodes] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [viewMode, setViewMode] = useState('list') // 'list' | 'grid'

  // Modals & Popups
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newQrName, setNewQrName] = useState('')
  const [newQrDesc, setNewQrDesc] = useState('')
  const [creating, setCreating] = useState(false)
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [qrToDelete, setQrToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [toast, setToast] = useState(null)
  const [copiedId, setCopiedId] = useState(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  async function loadData() {
    setLoading(true)
    try {
      const [codesData, statsData] = await Promise.allSettled([
        getQrCodes(),
        getDashboardStats(),
      ])

      if (codesData.status === 'fulfilled' && Array.isArray(codesData.value)) {
        setQrCodes(codesData.value)
      } else {
        setQrCodes([])
      }

      if (statsData.status === 'fulfilled' && statsData.value) {
        setStats(statsData.value)
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      setQrCodes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()

    function handleOpenCreate() {
      setShowCreateModal(true)
    }
    window.addEventListener('open-create-qr', handleOpenCreate)
    return () => window.removeEventListener('open-create-qr', handleOpenCreate)
  }, [])

  useEffect(() => {
    function handleDocClick() {
      setActiveMenuId(null)
    }
    document.addEventListener('click', handleDocClick)
    return () => document.removeEventListener('click', handleDocClick)
  }, [])

  async function handleCreateQr(e) {
    if (e) e.preventDefault()
    if (!newQrName.trim()) return
    setCreating(true)
    try {
      const created = await createQrCode(newQrName.trim(), newQrDesc.trim())
      setQrCodes(prev => [created, ...prev])
      setShowCreateModal(false)
      setNewQrName('')
      setNewQrDesc('')
      showToast('Dynamic QR Code created successfully!')
      navigate(`/qr/${created.id}`)
    } catch (err) {
      console.error('Error creating QR code:', err)
      showToast(err.message || 'Failed to create QR code.')
    } finally {
      setCreating(false)
    }
  }

  function handleCreateWithTemplate(templateName) {
    setNewQrName(templateName)
    setShowCreateModal(true)
  }

  async function handleConfirmDelete() {
    if (!qrToDelete) return
    setDeleting(true)
    try {
      await deleteQrCode(qrToDelete.id)
      showToast('QR code deleted successfully')
      setQrCodes(prev => prev.filter(q => q.id !== qrToDelete.id))
      setQrToDelete(null)
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }

  async function handleToggleQr(qr, e) {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }
    const nextState = qr.is_enabled === false ? true : false
    // Optimistic UI update
    setQrCodes(prev =>
      prev.map(q => (q.id === qr.id ? { ...q, is_enabled: nextState } : q))
    )
    showToast(`${qr.name} is now ${nextState ? 'Active 🟢' : 'Not Active (Deactivated) ⚪'}`)

    try {
      await toggleQrCode(qr.id)
    } catch (err) {
      console.error('Failed to toggle QR status:', err)
      // Rollback on error
      setQrCodes(prev =>
        prev.map(q => (q.id === qr.id ? { ...q, is_enabled: !nextState } : q))
      )
      showToast('Failed to update status. Please try again.')
    }
  }

  function handleCopy(url, id, e) {
    if (e) e.stopPropagation()
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    showToast('Short URL copied to clipboard! 📋')
    setTimeout(() => setCopiedId(null), 2000)
  }

  // Calculations
  const totalScans = qrCodes.reduce((sum, q) => sum + (q.total_scans || 0), 0)
  const activeRoutes = qrCodes.filter(q => q.is_active !== false).length
  const topCode = [...qrCodes].sort((a, b) => (b.total_scans || 0) - (a.total_scans || 0))[0]

  // Filtering & Sorting
  const filteredQrs = qrCodes
    .filter(q => {
      const qname = q.name?.toLowerCase() || ''
      const qslug = q.slug?.toLowerCase() || ''
      const qurl = q.redirect_url?.toLowerCase() || ''
      const query = searchQuery.toLowerCase()
      return qname.includes(query) || qslug.includes(query) || qurl.includes(query)
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.created_at) - new Date(a.created_at)
      if (sortBy === 'oldest') return new Date(a.created_at) - new Date(b.created_at)
      if (sortBy === 'scans') return (b.total_scans || 0) - (a.total_scans || 0)
      if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '')
      return 0
    })

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  return (
    <div className="pro-dashboard-page">
      {/* Toast Notification */}
      {toast && (
        <div className="impr-toast-banner">
          <CheckCircle2 size={16} color="var(--accent-green)" />
          <span>{toast}</span>
        </div>
      )}

      {/* ─── 1. Executive Top Header ─── */}
      <div className="pro-header">
        <div className="pro-header-left">
          <div className="pro-header-tag">
            <span className="pulse-dot" />
            <span>{isQrListPage ? 'IMPRscan Dynamic Fleet' : 'IMPRscan Cloud · Live Hub'}</span>
          </div>
          {isQrListPage ? (
            <>
              <h1 className="pro-header-title">
                All <span className="gradient-text">QR Codes</span>
              </h1>
              <p className="pro-header-subtitle">
                Manage, activate or deactivate, filter, and configure all your dynamic QR codes.
              </p>
            </>
          ) : (
            <>
              <h1 className="pro-header-title">
                QR Analytics & <span className="gradient-text">Fleet Management</span>
              </h1>
              <p className="pro-header-subtitle">
                Monitor real-time scan volume, configure instant dynamic 302 routing, and download vector QR assets.
              </p>
            </>
          )}
        </div>

        <button
          type="button"
          className="pro-btn-create"
          onClick={() => {
            setNewQrName('')
            setNewQrDesc('')
            setShowCreateModal(true)
          }}
        >
          <Plus size={18} />
          <span>Create Dynamic QR</span>
        </button>
      </div>

      {/* ─── 2. Executive KPI Cards (Row of 4) — Only on Dashboard ─── */}
      {!isQrListPage && (
        <div className="pro-kpis-grid">
          {/* Active QR Codes */}
          <div className="pro-kpi-card" style={{ '--kpi-border': '#06b6d4' }}>
            <div className="pro-kpi-info">
              <span className="pro-kpi-label">Active QR Codes</span>
              <span className="pro-kpi-value">{loading ? '—' : qrCodes.length}</span>
              <span className="pro-kpi-meta">
                <Layers size={13} color="var(--accent)" />
                <span>Permanent dynamic IDs</span>
              </span>
            </div>
            <div className="pro-kpi-icon-box" style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent)' }}>
              <QrCode size={24} />
            </div>
          </div>

          {/* Total Scans */}
          <div className="pro-kpi-card" style={{ '--kpi-border': '#10b981' }}>
            <div className="pro-kpi-info">
              <span className="pro-kpi-label">Total Scans</span>
              <span className="pro-kpi-value">
                {loading ? '—' : (stats?.total_scans ?? totalScans).toLocaleString()}
              </span>
              <span className="pro-kpi-meta">
                <TrendingUp size={13} color="var(--accent-green)" />
                <span>Today: {stats?.today_scans ?? 0} scans</span>
              </span>
            </div>
            <div className="pro-kpi-icon-box" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-green)' }}>
              <Activity size={24} />
            </div>
          </div>

          {/* Routing Links */}
          <div className="pro-kpi-card" style={{ '--kpi-border': '#f59e0b' }}>
            <div className="pro-kpi-info">
              <span className="pro-kpi-label">Live Destinations</span>
              <span className="pro-kpi-value">
                {loading ? '—' : (stats?.active_links ?? activeRoutes)}
              </span>
              <span className="pro-kpi-meta">
                <Zap size={13} color="var(--accent-yellow)" />
                <span>Instant redirect ready</span>
              </span>
            </div>
            <div className="pro-kpi-icon-box" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-yellow)' }}>
              <Globe size={24} />
            </div>
          </div>

          {/* System Health */}
          <div className="pro-kpi-card" style={{ '--kpi-border': '#8b5cf6' }}>
            <div className="pro-kpi-info">
              <span className="pro-kpi-label">System Status</span>
              <span className="pro-kpi-value" style={{ color: 'var(--accent-green)', fontSize: '1.65rem' }}>
                100% Live
              </span>
              <span className="pro-kpi-meta">
                <ShieldCheck size={13} color="var(--accent-green)" />
                <span>Zero redirect latency</span>
              </span>
            </div>
            <div className="pro-kpi-icon-box" style={{ background: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa' }}>
              <Sparkles size={24} />
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. Analytics Overview & Routing Insight Row — Only on Dashboard ─── */}
      {!isQrListPage && !loading && qrCodes.length > 0 && (
        <div className="pro-analytics-row">
          {/* Left: Scan Traffic Breakdown by Code */}
          <div className="pro-panel-card">
            <div className="pro-panel-header">
              <div className="pro-panel-title">
                <BarChart2 size={18} color="var(--accent)" />
                <span>Scan Engagement Breakdown</span>
              </div>
              <Link to="/analytics" className="pro-panel-action">
                <span>Detailed Analytics</span>
                <ArrowRight size={13} />
              </Link>
            </div>

            <div className="pro-chart-bars-wrap">
              {qrCodes.slice(0, 4).map(qr => {
                const count = qr.total_scans || 0
                const maxScans = Math.max(...qrCodes.map(c => c.total_scans || 0), 1)
                const pct = Math.round((count / maxScans) * 100)

                return (
                  <div key={qr.id} className="pro-bar-row">
                    <div className="pro-bar-info">
                      <span className="pro-bar-name">
                        <QrCode size={13} color="var(--text-muted)" />
                        <span>{qr.name}</span>
                      </span>
                      <span className="pro-bar-count">
                        {count} {count === 1 ? 'scan' : 'scans'}
                      </span>
                    </div>
                    <div className="pro-bar-track">
                      <div className="pro-bar-fill" style={{ width: `${Math.max(pct, 6)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Quick Active Destination Hub */}
          <div className="pro-panel-card">
            <div className="pro-panel-header">
              <div className="pro-panel-title">
                <Globe size={18} color="var(--accent-yellow)" />
                <span>Live Routing Hub</span>
              </div>
              {topCode && (
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-green)', fontWeight: 600 }}>
                  Top: {topCode.name}
                </span>
              )}
            </div>

            <div className="pro-active-dest-card">
              <div className="pro-dest-pill">
                <span className="pro-dest-label">Active Redirect Route</span>
                <div className="pro-dest-url" title={topCode?.redirect_url || 'No active destination'}>
                  <Link2 size={14} />
                  <span>{topCode?.redirect_url || 'No destination link attached'}</span>
                </div>
              </div>

              <div className="pro-dest-buttons-row">
                {topCode && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={e => handleCopy(topCode.redirect_url, topCode.id, e)}
                    >
                      <Copy size={13} />
                      <span>{copiedId === topCode.id ? 'Copied Link!' : 'Copy Short URL'}</span>
                    </button>

                    <a
                      href={topCode.redirect_url}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-ghost btn-sm"
                    >
                      <ExternalLink size={13} />
                      <span>Test Redirect</span>
                    </a>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 4. Fleet Management Toolbar ─── */}
      <div className="pro-toolbar-card">
        <div className="pro-search-box">
          <Search size={18} className="pro-search-icon" />
          <input
            type="text"
            className="pro-search-input"
            placeholder="Search by code name, destination URL, or slug..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="pro-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Clear Search"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="pro-toolbar-right">
          <div className="pro-select-wrap">
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="pro-select"
            >
              <option value="newest">Newest First</option>
              <option value="scans">Most Scanned</option>
              <option value="name">Alphabetical (A–Z)</option>
              <option value="oldest">Oldest First</option>
            </select>
            <ChevronDown size={14} className="pro-select-arrow" />
          </div>

          <div className="pro-view-toggles">
            <button
              type="button"
              className={`pro-view-btn ${viewMode === 'list' ? 'active' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={16} />
            </button>
            <button
              type="button"
              className={`pro-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
              onClick={() => setViewMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* ─── 5. QR Codes Fleet Content (List / Grid / Empty) ─── */}
      {loading ? (
        <div className="dashboard-loading-state">
          <span className="spinner" />
          <p>Loading your dynamic QR codes fleet...</p>
        </div>
      ) : filteredQrs.length === 0 ? (
        <div className="pro-empty-card">
          <div className="pro-empty-halo">
            <QrCode size={40} />
          </div>
          <h3 className="pro-empty-title">
            {searchQuery ? `No codes match "${searchQuery}"` : 'No Dynamic QR Codes Yet'}
          </h3>
          <p className="pro-empty-desc">
            {searchQuery
              ? 'Try modifying your search term or clear the filter to see all active dynamic QR codes.'
              : 'Create your first permanent dynamic QR code. You can update the redirect destination at any time without reprinting, and track real-time scan analytics.'}
          </p>

          <button
            type="button"
            className="pro-btn-create"
            onClick={() => {
              setNewQrName('')
              setShowCreateModal(true)
            }}
          >
            <Plus size={18} />
            <span>Create Your First QR Code</span>
          </button>

          {!searchQuery && (
            <div className="pro-template-chips">
              <button
                type="button"
                className="pro-chip"
                onClick={() => handleCreateWithTemplate('Company Website URL')}
              >
                <Globe size={13} color="var(--accent)" />
                <span>Company Website</span>
              </button>
              <button
                type="button"
                className="pro-chip"
                onClick={() => handleCreateWithTemplate('Social Bio Link')}
              >
                <Sparkles size={13} color="var(--accent-2)" />
                <span>Social Bio Tree</span>
              </button>
              <button
                type="button"
                className="pro-chip"
                onClick={() => handleCreateWithTemplate('Restaurant Menu PDF')}
              >
                <Zap size={13} color="var(--accent-green)" />
                <span>Restaurant Menu</span>
              </button>
              <button
                type="button"
                className="pro-chip"
                onClick={() => handleCreateWithTemplate('Google Review Link')}
              >
                <TrendingUp size={13} color="#8b5cf6" />
                <span>Google Review</span>
              </button>
            </div>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* ─── Grid View ─── */
        <div className="pro-qr-grid">
          {filteredQrs.map(qr => {
            const qrImageUrl = `${BASE_URL}/api/qr/${qr.id}/image?format=png`
            const createdDate = qr.created_at
              ? new Date(qr.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent'

            return (
              <div
                key={qr.id}
                className={`pro-grid-item ${qr.is_enabled === false ? 'is-deactivated' : ''}`}
                onClick={() => navigate(`/qr/${qr.id}`)}
              >
                <div className="pro-grid-top">
                  <div className="pro-qr-thumb">
                    <img src={qrImageUrl} alt={qr.name} />
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.45rem', marginBottom: '0.35rem' }}>
                      <h3 className="pro-qr-name" style={{ fontSize: '1.05rem', margin: 0 }}>{qr.name}</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                        <span className={qr.is_enabled !== false ? 'pro-live-pill' : 'pro-inactive-pill'}>
                          <span className={qr.is_enabled !== false ? 'green-dot' : 'inactive-dot'} />
                          {qr.is_enabled !== false ? 'Active' : 'Not Active'}
                        </span>
                        <label
                          className="qr-toggle-label"
                          onClick={e => e.stopPropagation()}
                          title={qr.is_enabled !== false ? 'Click to deactivate QR' : 'Click to activate QR'}
                        >
                          <input
                            type="checkbox"
                            checked={qr.is_enabled !== false}
                            onChange={e => handleToggleQr(qr, e)}
                            style={{ display: 'none' }}
                          />
                          <span className={`qr-toggle-track ${qr.is_enabled !== false ? 'on' : 'off'}`}>
                            <span className="qr-toggle-thumb" />
                          </span>
                        </label>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                      Created {createdDate}
                    </div>

                    {qr.description && (
                      <p style={{
                        fontSize: '0.78rem',
                        color: 'var(--text-muted)',
                        marginBottom: '0.45rem',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: 1.4,
                      }}>
                        {qr.description}
                      </p>
                    )}

                    <div className="pro-url-pill" onClick={e => e.stopPropagation()}>
                      <Link2 size={12} color="var(--accent)" />
                      <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {qr.redirect_url || `/${qr.slug}`}
                      </span>
                      <button
                        type="button"
                        className="pro-icon-btn"
                        onClick={e => handleCopy(qr.redirect_url, qr.id, e)}
                        title="Copy Link"
                      >
                        {copiedId === qr.id ? <Check size={12} color="var(--accent-green)" /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="pro-grid-footer" onClick={e => e.stopPropagation()}>
                  <div className="pro-scans-box" style={{ textAlign: 'left' }}>
                    <span className="pro-scans-number" style={{ fontSize: '1.3rem' }}>{qr.total_scans || 0}</span>
                    <span className="pro-scans-label" style={{ justifyContent: 'flex-start' }}>
                      <span>Total Scans</span>
                      <TrendingUp size={11} color="var(--accent)" />
                    </span>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="pro-btn-dots"
                      onClick={e => {
                        e.stopPropagation()
                        setActiveMenuId(prev => prev === qr.id ? null : qr.id)
                      }}
                      title="Options"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {activeMenuId === qr.id && (
                      <div className="pro-dropdown-menu" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          className="pro-menu-item"
                          onClick={e => {
                            setActiveMenuId(null)
                            handleToggleQr(qr, e)
                          }}
                        >
                          <Activity size={14} color={qr.is_enabled !== false ? 'var(--accent-green)' : '#94a3b8'} />
                          <span>{qr.is_enabled !== false ? 'Deactivate QR Code' : 'Activate QR Code'}</span>
                        </button>
                        <button
                          type="button"
                          className="pro-menu-item"
                          onClick={() => {
                            setActiveMenuId(null)
                            navigate(`/qr/${qr.id}`)
                          }}
                        >
                          <Link2 size={14} />
                          <span>View & Edit Destinations</span>
                        </button>
                        <a
                          href={getQrDownloadUrl(qr.id, 'png')}
                          download
                          className="pro-menu-item"
                          onClick={() => setActiveMenuId(null)}
                        >
                          <Download size={14} />
                          <span>Download High-Res PNG</span>
                        </a>
                        <a
                          href={getQrDownloadUrl(qr.id, 'svg')}
                          download
                          className="pro-menu-item"
                          onClick={() => setActiveMenuId(null)}
                        >
                          <Download size={14} />
                          <span>Download Vector SVG</span>
                        </a>
                        <button
                          type="button"
                          className="pro-menu-item"
                          onClick={e => {
                            setActiveMenuId(null)
                            handleCopy(qr.redirect_url, qr.id, e)
                          }}
                        >
                          {copiedId === qr.id ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                          <span>{copiedId === qr.id ? 'Copied Link!' : 'Copy Short Link'}</span>
                        </button>
                        <Link
                          to="/analytics"
                          className="pro-menu-item"
                          onClick={() => setActiveMenuId(null)}
                        >
                          <BarChart2 size={14} />
                          <span>View Deep Analytics</span>
                        </Link>
                        <Link
                          to={`/qr/${qr.id}/edit`}
                          className="pro-menu-item"
                          onClick={() => setActiveMenuId(null)}
                        >
                          <Palette size={14} />
                          <span>Customize QR Styling</span>
                        </Link>
                        <div className="pro-menu-divider" />
                        <button
                          type="button"
                          className="pro-menu-item danger"
                          onClick={() => {
                            setActiveMenuId(null)
                            setQrToDelete(qr)
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Delete QR Code</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* ─── List View ─── */
        <div className="pro-qr-list">
          {filteredQrs.map(qr => {
            const qrImageUrl = `${BASE_URL}/api/qr/${qr.id}/image?format=png`
            const createdDate = qr.created_at
              ? new Date(qr.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'Recent'

            return (
              <div
                key={qr.id}
                className={`pro-qr-card ${qr.is_enabled === false ? 'is-deactivated' : ''}`}
                onClick={() => navigate(`/qr/${qr.id}`)}
              >
                {/* Left QR Image Thumbnail */}
                <div className="pro-qr-thumb">
                  <img src={qrImageUrl} alt={qr.name} />
                </div>

                {/* Middle Info */}
                <div className="pro-qr-content">
                  <div className="pro-qr-top-line">
                    <h3 className="pro-qr-name">{qr.name}</h3>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className={qr.is_enabled !== false ? 'pro-live-pill' : 'pro-inactive-pill'}>
                        <span className={qr.is_enabled !== false ? 'green-dot' : 'inactive-dot'} />
                        {qr.is_enabled !== false ? 'Active' : 'Not Active'}
                      </span>
                      <label
                        className="qr-toggle-label"
                        onClick={e => e.stopPropagation()}
                        title={qr.is_enabled !== false ? 'Click to deactivate QR' : 'Click to activate QR'}
                      >
                        <input
                          type="checkbox"
                          checked={qr.is_enabled !== false}
                          onChange={e => handleToggleQr(qr, e)}
                          style={{ display: 'none' }}
                        />
                        <span className={`qr-toggle-track ${qr.is_enabled !== false ? 'on' : 'off'}`}>
                          <span className="qr-toggle-thumb" />
                        </span>
                      </label>
                    </div>
                  </div>

                  <div className="pro-qr-meta">
                    <span>Website URL</span>
                    <span>·</span>
                    <span>Created {createdDate}</span>
                    <span>·</span>
                  </div>

                  {qr.description && (
                    <p style={{
                      fontSize: '0.8rem',
                      color: 'var(--text-muted)',
                      margin: '0.25rem 0 0.45rem 0',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                      lineHeight: 1.4,
                    }}>
                      {qr.description}
                    </p>
                  )}

                  <div className="pro-qr-meta" style={{ marginTop: '0.1rem' }}>
                    <div className="pro-url-pill" onClick={e => e.stopPropagation()}>
                      <Link2 size={12} color="var(--accent)" />
                      <span style={{ maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {qr.redirect_url || `/${qr.slug}`}
                      </span>
                      <button
                        type="button"
                        className="pro-icon-btn"
                        onClick={e => handleCopy(qr.redirect_url, qr.id, e)}
                        title="Copy Short Link"
                      >
                        {copiedId === qr.id ? <Check size={12} color="var(--accent-green)" /> : <Copy size={12} />}
                      </button>
                      <a
                        href={qr.redirect_url}
                        target="_blank"
                        rel="noreferrer"
                        className="pro-icon-btn"
                        title="Open in new tab"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </div>
                </div>

                {/* Right Scan Stats & 3-Dots Menu */}
                <div className="pro-qr-right-stats" onClick={e => e.stopPropagation()}>
                  <div className="pro-scans-box">
                    <span className="pro-scans-number">{qr.total_scans || 0}</span>
                    <span className="pro-scans-label">
                      <span>scans</span>
                      <TrendingUp size={11} color="var(--accent)" />
                    </span>
                  </div>

                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="pro-btn-dots"
                      onClick={e => {
                        e.stopPropagation()
                        setActiveMenuId(prev => prev === qr.id ? null : qr.id)
                      }}
                      title="Options"
                    >
                      <MoreHorizontal size={18} />
                    </button>

                    {activeMenuId === qr.id && (
                      <div className="pro-dropdown-menu" onClick={e => e.stopPropagation()}>
                        <button
                          type="button"
                          className="pro-menu-item"
                          onClick={e => {
                            setActiveMenuId(null)
                            handleToggleQr(qr, e)
                          }}
                        >
                          <Activity size={14} color={qr.is_enabled !== false ? 'var(--accent-green)' : '#94a3b8'} />
                          <span>{qr.is_enabled !== false ? 'Deactivate QR Code' : 'Activate QR Code'}</span>
                        </button>
                        <button
                          type="button"
                          className="pro-menu-item"
                          onClick={() => {
                            setActiveMenuId(null)
                            navigate(`/qr/${qr.id}`)
                          }}
                        >
                          <Link2 size={14} />
                          <span>View & Edit Destinations</span>
                        </button>
                        <a
                          href={getQrDownloadUrl(qr.id, 'png')}
                          download
                          className="pro-menu-item"
                          onClick={() => setActiveMenuId(null)}
                        >
                          <Download size={14} />
                          <span>Download High-Res PNG</span>
                        </a>
                        <a
                          href={getQrDownloadUrl(qr.id, 'svg')}
                          download
                          className="pro-menu-item"
                          onClick={() => setActiveMenuId(null)}
                        >
                          <Download size={14} />
                          <span>Download Vector SVG</span>
                        </a>
                        <button
                          type="button"
                          className="pro-menu-item"
                          onClick={e => {
                            setActiveMenuId(null)
                            handleCopy(qr.redirect_url, qr.id, e)
                          }}
                        >
                          {copiedId === qr.id ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
                          <span>{copiedId === qr.id ? 'Copied Link!' : 'Copy Short Link'}</span>
                        </button>
                        <Link
                          to="/analytics"
                          className="pro-menu-item"
                          onClick={() => setActiveMenuId(null)}
                        >
                          <BarChart2 size={14} />
                          <span>View Deep Analytics</span>
                        </Link>
                        <Link
                          to={`/qr/${qr.id}/edit`}
                          className="pro-menu-item"
                          onClick={() => setActiveMenuId(null)}
                        >
                          <Palette size={14} />
                          <span>Customize QR Styling</span>
                        </Link>
                        <div className="pro-menu-divider" />
                        <button
                          type="button"
                          className="pro-menu-item danger"
                          onClick={() => {
                            setActiveMenuId(null)
                            setQrToDelete(qr)
                          }}
                        >
                          <Trash2 size={14} />
                          <span>Delete QR Code</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ─── 6. Pagination Footer ─── */}
      {!loading && filteredQrs.length > 0 && (
        <div className="dashboard-pagination-bar">
          <div className="pagination-info">
            Showing <strong>1–{filteredQrs.length}</strong> of <strong>{qrCodes.length}</strong> dynamic codes
          </div>
          <div className="pagination-per-page">
            <span>Per page</span>
            <div className="per-page-select-wrap">
              <select defaultValue="24" className="per-page-select">
                <option value="24">24</option>
                <option value="48">48</option>
                <option value="100">100</option>
              </select>
              <ChevronDown size={13} className="per-page-chevron" />
            </div>
          </div>
        </div>
      )}

      {/* ─── 7. Create Dynamic QR Modal ─── */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Create Dynamic QR Code</div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateQr} className="modal-form">
              <div className="form-group">
                <label>Code Name / Campaign Title</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Promo, Table Menu, Product Page"
                  value={newQrName}
                  onChange={e => setNewQrName(e.target.value)}
                  required
                  autoFocus
                />
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                  A permanent short link will be assigned automatically. You can change destination URLs anytime.
                </span>
              </div>

              <div className="form-group" style={{ marginTop: '0.9rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <label style={{ margin: 0 }}>Description (Optional)</label>
                  <span style={{ fontSize: '0.75rem', color: newQrDesc.length > 2400 ? 'var(--accent-yellow)' : 'var(--text-muted)' }}>
                    {newQrDesc.length} / 2500
                  </span>
                </div>
                <textarea
                  placeholder="Add campaign details, instructions, or notes (0 to 2,500 characters)..."
                  value={newQrDesc}
                  onChange={e => {
                    if (e.target.value.length <= 2500) {
                      setNewQrDesc(e.target.value)
                    }
                  }}
                  maxLength={2500}
                  rows={4}
                  style={{
                    width: '100%',
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '10px',
                    padding: '0.75rem',
                    color: '#f8fafc',
                    fontSize: '0.88rem',
                    fontFamily: 'inherit',
                    resize: 'vertical',
                    outline: 'none',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Quick Suggestions
                </span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                  {['Website Link', 'Social Bio Tree', 'Digital Menu', 'Google Reviews'].map(name => (
                    <button
                      key={name}
                      type="button"
                      className="btn btn-ghost btn-sm"
                      style={{ fontSize: '0.78rem', padding: '0.25rem 0.6rem' }}
                      onClick={() => setNewQrName(name)}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pro-btn-create"
                  disabled={creating}
                  style={{ padding: '0.55rem 1.25rem' }}
                >
                  {creating ? <span className="spinner" /> : 'Create QR Code →'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 8. Centered Delete Confirmation Modal ─── */}
      <ConfirmModal
        isOpen={Boolean(qrToDelete)}
        title="Delete QR Code?"
        message={`Are you sure you want to delete "${qrToDelete?.name}"? All attached destination links and scan analytics will be permanently destroyed.`}
        confirmText="Yes, Delete QR"
        cancelText="Cancel"
        isDanger={true}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setQrToDelete(null)}
      />
    </div>
  )
}
