import { useState } from 'react'
import { Link2, ArrowRight, ExternalLink, CheckCircle2 } from 'lucide-react'

export default function ActiveLinkCard({ activeLink, qrCodes = [], onLinkActivated }) {
  const [showModal, setShowModal] = useState(false)

  return (
    <>
      <div className="card active-link-banner" style={{ marginTop: '1.25rem', padding: '1.25rem 1.5rem' }}>
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '10px',
                background: 'rgba(99, 102, 241, 0.15)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent)',
              }}
            >
              <Link2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="live-dot" />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                  {activeLink?.title || 'No active destination link'}
                </span>
                {activeLink && (
                  <span className="badge badge-active flex items-center gap-1">
                    <CheckCircle2 size={12} />
                    Live Active
                  </span>
                )}
              </div>
              <div className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>
                {activeLink?.url ? (
                  <a
                    href={activeLink.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate flex items-center gap-1"
                    style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
                  >
                    {activeLink.url}
                    <ExternalLink size={11} />
                  </a>
                ) : (
                  'Create a link and toggle it active to start redirecting scans'
                )}
              </div>
            </div>
          </div>

          <button
            className="btn btn-primary btn-sm flex items-center gap-1.5"
            onClick={() => setShowModal(true)}
          >
            Change Active Link
            <ArrowRight size={14} />
          </button>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">Switch Active Link</div>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div style={{ padding: '1rem 0' }}>
              <p className="text-sm text-muted" style={{ marginBottom: '1rem' }}>
                To manage and switch destinations, visit the <strong>Links & QR Codes</strong> page. Every switch applies instantly to subsequent scans!
              </p>
              <div className="modal-footer">
                <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Close</button>
                <a href="/links" className="btn btn-primary flex items-center gap-1.5" style={{ textDecoration: 'none' }}>
                  Go to Links Management
                  <ArrowRight size={14} />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
