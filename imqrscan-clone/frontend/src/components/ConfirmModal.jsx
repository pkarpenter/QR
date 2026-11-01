import { Trash2, AlertTriangle, X } from 'lucide-react'

export default function ConfirmModal({
  isOpen,
  title = 'Delete Confirmation',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  isDanger = true,
  loading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 420, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-0.75rem', marginRight: '-0.5rem' }}>
          <button type="button" className="modal-close" onClick={onCancel}>
            <X size={18} />
          </button>
        </div>

        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            background: isDanger ? 'rgba(239, 68, 68, 0.15)' : 'rgba(99, 102, 241, 0.15)',
            color: isDanger ? 'var(--accent-red)' : 'var(--accent)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1.15rem auto',
          }}
        >
          {isDanger ? <Trash2 size={26} /> : <AlertTriangle size={26} />}
        </div>

        <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
          {title}
        </h3>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.55, marginBottom: '1.75rem' }}>
          {message}
        </p>

        <div className="flex gap-3 justify-center">
          <button
            type="button"
            className="btn btn-ghost"
            style={{ minWidth: 105, padding: '0.6rem 1.25rem' }}
            onClick={onCancel}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${isDanger ? 'btn-danger' : 'btn-primary'} flex items-center justify-center gap-1.5`}
            style={{ minWidth: 115, padding: '0.6rem 1.25rem' }}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <span className="spinner" /> : <><Trash2 size={15} /> {confirmText}</>}
          </button>
        </div>
      </div>
    </div>
  )
}
