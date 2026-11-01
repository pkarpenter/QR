import { useState } from 'react'
import { X } from 'lucide-react'

export default function EditLinkModal({ link, onClose, onSubmit, saving }) {
  const [formData, setFormData] = useState({
    title: link?.title || '',
    url: link?.url || ''
  })
  const [error, setError] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    setError('')
    const urlClean = formData.url.trim().toLowerCase()
    if (!urlClean.startsWith('http://') && !urlClean.startsWith('https://')) {
      setError('URL must start with http:// or https://')
      return
    }
    onSubmit(link.id, formData)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">Edit Link</div>
          <button type="button" className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-form">
          {error && (
            <div style={{ color: '#ef4444', fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              {error}
            </div>
          )}
          <div className="form-group">
            <label>Title</label>
            <input
              placeholder="Link title"
              value={formData.title}
              onChange={e => setFormData(f => ({ ...f, title: e.target.value }))}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label>Destination URL</label>
            <input
              type="url"
              placeholder="https://example.com"
              value={formData.url}
              onChange={e => setFormData(f => ({ ...f, url: e.target.value }))}
              required
            />
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
