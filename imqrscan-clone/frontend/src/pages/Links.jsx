import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Globe,
  Sparkles,
  Edit2,
  BarChart2,
  Share2,
  Tag,
  MoreHorizontal,
  Link2,
  Copy,
  ExternalLink,
  Download,
  Smartphone,
  Plus,
  Trash2,
  Check,
  CheckCircle2,
  X,
  Info,
} from 'lucide-react'
import LinkTable from '../components/Links/LinkTable'
import AddLinkModal from '../components/Links/AddLinkModal'
import ConfirmModal from '../components/ConfirmModal'
import {
  getQrCodes,
  getLinks,
  addLink,
  updateQrCode,
  deleteQrCode,
  getQrDownloadUrl,
  getMultiLinkConfig,
  saveMultiLinkConfig,
} from '../lib/api'

export default function Links() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [qrCodes, setQrCodes] = useState([])
  const [currentQr, setCurrentQr] = useState(null)
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)

  // Multi-Link Landing Page Mode State
  const [isMultiLink, setIsMultiLink] = useState(false)
  const [activeMultiLinkIds, setActiveMultiLinkIds] = useState([])
  const [savingMultiMode, setSavingMultiMode] = useState(false)
  const isMultiLinkRef = useRef(false)
  const activeMultiLinkIdsRef = useRef([])

  // Download options
  const [downloadSize, setDownloadSize] = useState('1024')

  // Modals & Popups
  const [showEditNameModal, setShowEditNameModal] = useState(false)
  const [editNameValue, setEditNameValue] = useState('')
  const [savingName, setSavingName] = useState(false)

  const [showAddLinkModal, setShowAddLinkModal] = useState(false)
  const [savingLink, setSavingLink] = useState(false)

  const [showDeleteQrModal, setShowDeleteQrModal] = useState(false)
  const [deletingQr, setDeletingQr] = useState(false)

  const [copiedLink, setCopiedLink] = useState(false)
  const [optionsOpen, setOptionsOpen] = useState(false)
  const [toast, setToast] = useState(null)

  const optionsRef = useRef(null)

  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    loadAllQrs()
  }, [id])

  async function loadAllQrs() {
    setLoading(true)
    try {
      const data = await getQrCodes()
      setQrCodes(data || [])
      if (data && data.length > 0) {
        const found = id ? data.find(q => q.id === id) : data[0]
        const selected = found || data[0]
        setCurrentQr(selected)
        setEditNameValue(selected.name)
        loadLinksForQr(selected.id)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function loadLinksForQr(qrId) {
    try {
      const [l, cfg] = await Promise.all([
        getLinks(qrId),
        getMultiLinkConfig(qrId).catch(err => {
          console.warn('Could not load multi-link config:', err)
          return { is_multi_link: false, active_link_ids: [] }
        }),
      ])
      const fetchedLinks = l || []
      setLinks(fetchedLinks)
      if (cfg) {
        const mode = Boolean(cfg.is_multi_link || (cfg.active_link_ids && cfg.active_link_ids.length > 1))
        setIsMultiLink(mode)
        isMultiLinkRef.current = mode
        if (cfg.active_link_ids && cfg.active_link_ids.length > 0) {
          setActiveMultiLinkIds(cfg.active_link_ids)
          activeMultiLinkIdsRef.current = cfg.active_link_ids
        } else {
          // Default to the currently active link in database
          const activeIds = fetchedLinks.filter(item => item.is_active).map(item => item.id)
          setActiveMultiLinkIds(activeIds)
          activeMultiLinkIdsRef.current = activeIds
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  async function handleToggleMultiMode(checked) {
    if (!currentQr) return
    setIsMultiLink(checked)
    isMultiLinkRef.current = checked
    setSavingMultiMode(true)
    try {
      let currentActive = [...activeMultiLinkIdsRef.current]
      if (checked && currentActive.length === 0) {
        const def = links.filter(l => l.is_active).map(l => l.id)
        currentActive = def.length > 0 ? def : (links.length > 0 ? [links[0].id] : [])
        setActiveMultiLinkIds(currentActive)
        activeMultiLinkIdsRef.current = currentActive
      }
      await saveMultiLinkConfig(currentQr.id, {
        is_multi_link: checked,
        active_link_ids: currentActive,
      })
      showToast(
        checked
          ? 'Multiple active links mode ENABLED! Visitors will see a landing page.'
          : 'Single active link mode ENABLED! Visitors will be directly redirected.'
      )
    } catch (err) {
      console.error(err)
      showToast('Failed to save link mode')
    } finally {
      setSavingMultiMode(false)
    }
  }

  async function handleToggleMultiLinkItem(linkId) {
    if (!currentQr) return
    const currentList = activeMultiLinkIdsRef.current
    const isCurrentlyActive = currentList.includes(linkId)
    let nextActiveIds
    if (isCurrentlyActive) {
      if (currentList.length <= 1) {
        showToast('At least 1 link must remain active!')
        return
      }
      nextActiveIds = currentList.filter(itemId => itemId !== linkId)
    } else {
      nextActiveIds = [...currentList, linkId]
    }
    setActiveMultiLinkIds(nextActiveIds)
    activeMultiLinkIdsRef.current = nextActiveIds

    try {
      const currentMode = isMultiLinkRef.current || nextActiveIds.length > 1
      await saveMultiLinkConfig(currentQr.id, {
        is_multi_link: currentMode,
        active_link_ids: nextActiveIds,
      })
      showToast(isCurrentlyActive ? 'Link deactivated' : 'Link activated in landing page!')
    } catch (err) {
      console.error(err)
      showToast('Failed to update link status')
    }
  }

  // Close three dots menu on click outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (optionsRef.current && !optionsRef.current.contains(e.target)) {
        setOptionsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleCopyShortUrl() {
    if (!currentQr) return
    navigator.clipboard.writeText(currentQr.redirect_url)
    setCopiedLink(true)
    showToast('Short link copied to clipboard! 📋')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  async function handleSaveQrName(e) {
    e.preventDefault()
    if (!editNameValue.trim() || !currentQr) return
    setSavingName(true)
    try {
      const updated = await updateQrCode(currentQr.id, editNameValue.trim())
      setCurrentQr(prev => ({ ...prev, name: updated.name }))
      setQrCodes(prev => prev.map(q => q.id === currentQr.id ? { ...q, name: updated.name } : q))
      setShowEditNameModal(false)
      showToast('QR code renamed successfully!')
    } catch (err) {
      console.error(err)
    } finally {
      setSavingName(false)
    }
  }

  async function handleAddLinkSubmit(data) {
    if (!currentQr) return
    setSavingLink(true)
    try {
      await addLink(currentQr.id, data)
      await loadLinksForQr(currentQr.id)
      setShowAddLinkModal(false)
      showToast('Destination link added!')
    } catch (err) {
      console.error(err)
    } finally {
      setSavingLink(false)
    }
  }

  async function handleConfirmDeleteQr() {
    if (!currentQr) return
    setDeletingQr(true)
    try {
      await deleteQrCode(currentQr.id)
      showToast('QR code deleted')
      setShowDeleteQrModal(false)
      navigate('/')
    } catch (err) {
      console.error(err)
    } finally {
      setDeletingQr(false)
    }
  }

  if (loading) {
    return (
      <div className="qr-dark-page flex items-center justify-center" style={{ minHeight: '80vh' }}>
        <span className="spinner" />
      </div>
    )
  }

  if (!currentQr) {
    return (
      <div className="qr-dark-page" style={{ padding: '3rem', textAlign: 'center' }}>
        <h2>No QR Code Found</h2>
        <Link to="/qr" className="btn btn-primary" style={{ marginTop: '1rem', display: 'inline-flex' }}>
          ← Back to All Codes
        </Link>
      </div>
    )
  }

  const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const qrImageUrl = `${BASE_URL}/api/qr/${currentQr.id}/image?format=png`
  const activeLink = links.find(l => l.is_active)

  return (
    <div className="qr-dark-page">
      {/* Toast Notification */}
      {toast && (
        <div className="impr-toast-banner-dark">
          <CheckCircle2 size={16} color="var(--accent-green)" />
          <span>{toast}</span>
        </div>
      )}

      {/* Top Back Button */}
      <div className="qr-dark-top-nav">
        <Link to="/qr" className="btn-back-codes">
          <ArrowLeft size={16} />
          <span>All codes</span>
        </Link>
      </div>

      {/* Page Title & Action Bar */}
      <div className="qr-dark-header">
        <div className="qr-dark-title-left">
          <div className="qr-dark-avatar-icon">
            <Globe size={22} />
          </div>
          <div>
            <h1 className="qr-dark-title-text">{currentQr.name}</h1>
            <div className="qr-dark-badges-row">
              <span className="badge-dark-pill">Website URL</span>
              <span className="badge-dark-smart">
                <Sparkles size={12} />
                <span>Smart code</span>
              </span>
              <span className="badge-dark-live">
                <span className="live-dot-green" />
                Live
              </span>
            </div>
            {currentQr.description && (
              <p style={{ marginTop: '0.4rem', fontSize: '0.85rem', color: '#94a3b8', maxWidth: '600px', lineHeight: '1.4' }}>
                {currentQr.description}
              </p>
            )}
          </div>
        </div>

        {/* Top Right Action Buttons */}
        <div className="qr-dark-title-actions">
          <Link
            to={`/qr/${currentQr.id}/edit`}
            className="btn-dark-action"
          >
            <Edit2 size={15} />
            <span>Edit</span>
          </Link>


          <Link to={`/analytics`} className="btn-dark-action">
            <BarChart2 size={15} />
            <span>Analytics</span>
          </Link>

          <button
            type="button"
            className="btn-dark-action"
            onClick={handleCopyShortUrl}
          >
            <Share2 size={15} />
            <span>Share</span>
          </button>

          <button
            type="button"
            className="btn-dark-action"
            onClick={() => alert('Stickers & Print Templates coming soon')}
          >
            <Tag size={15} />
            <span>Stickers</span>
          </button>

          {/* Three dots menu */}
          <div className="qr-dark-more-menu-wrap" ref={optionsRef}>
            <button
              type="button"
              className="btn-dark-action-dots"
              onClick={() => setOptionsOpen(o => !o)}
            >
              <MoreHorizontal size={18} />
            </button>

            {optionsOpen && (
              <div className="qr-dark-dropdown">
                <button
                  type="button"
                  className="qr-dark-dropdown-item"
                  onClick={() => {
                    setOptionsOpen(false)
                    setShowEditNameModal(true)
                  }}
                >
                  <Edit2 size={14} />
                  <span>Rename QR Code</span>
                </button>
                <div className="qr-dark-dropdown-divider" />
                <button
                  type="button"
                  className="qr-dark-dropdown-item text-danger"
                  onClick={() => {
                    setOptionsOpen(false)
                    setShowDeleteQrModal(true)
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

      {/* Main Two-Column Layout */}
      <div className="qr-dark-grid">
        {/* ─── LEFT COLUMN: QR Code Card & Downloads ─── */}
        <div className="qr-dark-left-col">
          <div className="qr-dark-card qr-preview-box">
            {/* QR Visual Canvas */}
            <div className="qr-canvas-wrapper">
              <img
                src={qrImageUrl}
                alt={currentQr.name}
                className="qr-large-image"
              />
            </div>

            {/* Download Size Controls */}
            <div className="qr-download-controls">
              <label className="qr-control-label">Download size</label>
              <select
                value={downloadSize}
                onChange={e => setDownloadSize(e.target.value)}
                className="qr-dark-select"
              >
                <option value="1024">Medium, 1024 px (flyers, menus)</option>
                <option value="512">Small, 512 px (web, social)</option>
                <option value="2048">Large, 2048 px (posters, banners)</option>
                <option value="svg">Vector SVG (best for print)</option>
              </select>

              {/* PNG Download Button */}
              <a
                href={getQrDownloadUrl(currentQr.id, 'png')}
                download
                className="btn-download-primary"
              >
                <Download size={16} />
                <span>Download PNG</span>
              </a>

              {/* SVG Download Button */}
              <a
                href={getQrDownloadUrl(currentQr.id, 'svg')}
                download
                className="btn-download-secondary"
              >
                <Download size={16} />
                <span>Download SVG (best for print)</span>
              </a>

              {/* Phone Scan Tip */}
              <div className="qr-phone-tip">
                <Smartphone size={14} className="tip-phone-icon" />
                <span>Scan it with your own phone before printing.</span>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT COLUMN: Short Link & Feature Cards ─── */}
        <div className="qr-dark-right-col">
          {/* Card 1: Short Link & Destination Links */}
          <div className="qr-dark-card">
            <div className="card-dark-header">
              <div className="card-header-icon-wrap">
                <Link2 size={17} />
              </div>
              <h3 className="card-header-title">Short link</h3>
            </div>

            <div className="card-dark-body">
              {/* Short URL Box */}
              <div className="short-url-box-dark">
                <input
                  type="text"
                  readOnly
                  value={currentQr.redirect_url}
                  className="short-url-input-dark"
                />
                <button
                  type="button"
                  className="btn-copy-box"
                  onClick={handleCopyShortUrl}
                >
                  {copiedLink ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
                <a
                  href={currentQr.redirect_url}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-test-box"
                  title="Test redirect in new tab"
                >
                  <ExternalLink size={14} />
                  <span>Test</span>
                </a>
              </div>

              {/* Sends people to... */}
              <div className="sends-people-info">
                Sends people to:{' '}
                <strong>
                  {isMultiLink
                    ? `Landing Page (${activeMultiLinkIds.length} active links available)`
                    : (activeLink ? activeLink.url : 'No destination activated yet')}
                </strong>
              </div>

              {/* Dynamic Rule Banner */}
              <div className="dynamic-info-banner-dark">
                <Info size={15} className="info-banner-icon" />
                <span>
                  The link can be changed anytime with 1-click. The printed QR code never changes!
                </span>
              </div>

              {/* Multi-Link Mode Toggle Card */}
              <div className="multi-link-mode-card">
                <div className="multi-link-mode-header">
                  <label className="multi-link-checkbox-label">
                    <input
                      type="checkbox"
                      className="multi-link-checkbox-input"
                      checked={isMultiLink}
                      disabled={savingMultiMode}
                      onChange={e => handleToggleMultiMode(e.target.checked)}
                    />
                    <div className="multi-link-title-group">
                      <div className="multi-link-main-title">
                        Multiple Active Links (Landing Page Mode)
                        {isMultiLink ? (
                          <span className="badge-multi-on">Multi-Link Active</span>
                        ) : (
                          <span className="badge-single-on">1 Link Active (Direct Redirect)</span>
                        )}
                      </div>
                      <div className="multi-link-subtitle">
                        {isMultiLink
                          ? 'Visitors scanning your QR code will see a clean mobile landing page with all selected active links.'
                          : 'Standard behavior: Only 1 link is active at a time. Visitors scanning your QR code are immediately redirected.'}
                      </div>
                    </div>
                  </label>
                  {isMultiLink && (
                    <a
                      href={`${BASE_URL}/go/${currentQr.slug}?preview=1`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-preview-landing"
                      title="Preview how visitors see the multi-link landing page"
                    >
                      <ExternalLink size={13} />
                      <span>Preview Page</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Attached Destinations Table Header */}
              <div className="destinations-section-header">
                <div className="dest-title">
                  Destination Links ({links.length})
                </div>
                <button
                  type="button"
                  className="btn-add-dest"
                  onClick={() => setShowAddLinkModal(true)}
                >
                  <Plus size={14} />
                  <span>Add Link</span>
                </button>
              </div>

              {/* Destination Links Table */}
              <LinkTable
                qrId={currentQr.id}
                links={links}
                isMultiLink={isMultiLink}
                activeMultiLinkIds={activeMultiLinkIds}
                onToggleMultiLink={handleToggleMultiLinkItem}
                onRefresh={() => loadLinksForQr(currentQr.id)}
                onNotify={showToast}
              />
            </div>
          </div>


        </div>
      </div>

      {/* Edit QR Name Modal */}
      {showEditNameModal && (
        <div className="modal-overlay" onClick={() => setShowEditNameModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Rename QR Code</div>
              <button
                type="button"
                className="modal-close"
                onClick={() => setShowEditNameModal(false)}
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveQrName} className="modal-form">
              <div className="form-group">
                <label>QR Code Name</label>
                <input
                  value={editNameValue}
                  onChange={e => setEditNameValue(e.target.value)}
                  placeholder="Enter QR name"
                  required
                  autoFocus
                />
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowEditNameModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={savingName}
                >
                  {savingName ? <span className="spinner" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Destination Link Modal */}
      {showAddLinkModal && (
        <AddLinkModal
          qrName={currentQr.name}
          onClose={() => setShowAddLinkModal(false)}
          onSubmit={handleAddLinkSubmit}
          saving={savingLink}
        />
      )}

      {/* Centered QR Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteQrModal}
        title="Delete QR Code Permanently?"
        message={`Are you sure you want to delete "${currentQr.name}"? All destination links and scan analytics will be permanently destroyed.`}
        confirmText="Yes, Delete QR"
        cancelText="Cancel"
        isDanger={true}
        loading={deletingQr}
        onConfirm={handleConfirmDeleteQr}
        onCancel={() => setShowDeleteQrModal(false)}
      />
    </div>
  )
}
