import { useEffect, useState } from 'react'
import { Settings as SettingsIcon, AlertTriangle, Save, Trash2, Power, CheckCircle2 } from 'lucide-react'
import Topbar from '../components/Layout/Topbar'
import ConfirmModal from '../components/ConfirmModal'
import { getQrCodes, updateQrCode, toggleQrCode, deleteQrCode } from '../lib/api'


export default function Settings() {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000'
  const supUrl = import.meta.env.VITE_SUPABASE_URL || 'Not configured'

  const [qrCodes, setQrCodes] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [name, setName] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleting, setDeleting] = useState(false)


  function showToast(msg) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  useEffect(() => {
    loadQrs()
  }, [])

  async function loadQrs() {
    try {
      const data = await getQrCodes()
      setQrCodes(data)
      if (data.length && !selectedId) {
        setSelectedId(data[0].id)
        setName(data[0].name)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const currentQr = qrCodes.find(q => q.id === selectedId)

  function handleSelect(id) {
    setSelectedId(id)
    const q = qrCodes.find(item => item.id === id)
    if (q) setName(q.name)
  }

  async function handleSaveName(e) {
    e.preventDefault()
    if (!selectedId) return
    setSaving(true)
    try {
      const updated = await updateQrCode(selectedId, name)
      setQrCodes(c => c.map(q => q.id === selectedId ? { ...q, name: updated.name } : q))
      showToast('QR code name updated!')
    } catch (err) {
      console.error(err)
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus() {
    if (!currentQr) return
    try {
      const updated = await toggleQrCode(currentQr.id)
      setQrCodes(c => c.map(q => q.id === currentQr.id ? { ...q, is_enabled: updated.is_enabled } : q))
      showToast(updated.is_enabled ? 'QR code enabled' : 'QR code disabled')
    } catch (err) {
      console.error(err)
    }
  }

  function handleRequestDelete() {
    setShowDeleteModal(true)
  }

  async function handleConfirmDelete() {
    if (!currentQr) return
    setDeleting(true)
    try {
      await deleteQrCode(currentQr.id)
      showToast('QR code deleted')
      setShowDeleteModal(false)
      const updated = await getQrCodes()
      setQrCodes(updated)
      if (updated.length) {
        setSelectedId(updated[0].id)
        setName(updated[0].name)
      } else {
        setSelectedId('')
        setName('')
      }
    } catch (err) {
      console.error(err)
    } finally {
      setDeleting(false)
    }
  }


  return (
    <>
      <Topbar title="Settings" subtitle="QR code management & system configuration" />

      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '1.5rem',
            right: '1.5rem',
            background: 'var(--bg-card)',
            border: '1px solid var(--accent)',
            boxShadow: 'var(--shadow-glow)',
            color: 'var(--text-primary)',
            padding: '0.75rem 1.25rem',
            borderRadius: '8px',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={16} color="var(--accent-green)" />
          {toast}
        </div>
      )}

      <div className="page-body">
        {/* QR Code Selector & Name Edit */}
        <div className="card" style={{ maxWidth: 640, marginBottom: '1.5rem' }}>
          <div className="flex items-center gap-2" style={{ fontWeight: 700, marginBottom: '1.25rem' }}>
            <SettingsIcon size={18} color="var(--accent)" />
            Manage QR Code
          </div>

          {qrCodes.length === 0 ? (
            <div className="text-muted text-sm">No QR codes found. Create one in the Links section.</div>
          ) : (
            <>
              <div className="form-group" style={{ marginBottom: '1rem' }}>
                <label>Select QR Code</label>
                <select value={selectedId} onChange={e => handleSelect(e.target.value)}>
                  {qrCodes.map(q => (
                    <option key={q.id} value={q.id}>
                      {q.name} (/go/{q.slug})
                    </option>
                  ))}
                </select>
              </div>

              {currentQr && (
                <form onSubmit={handleSaveName}>
                  <div className="form-group" style={{ marginBottom: '1rem' }}>
                    <label>QR Code Name</label>
                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Menu QR, Promotional Stand"
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: '1.25rem' }}>
                    <label>Short Redirect URL (Permanent)</label>
                    <input
                      value={currentQr.redirect_url}
                      disabled
                      style={{ opacity: 0.6, cursor: 'not-allowed', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary flex items-center gap-1.5"
                    disabled={saving}
                  >
                    <Save size={14} />
                    {saving ? 'Saving...' : 'Save QR Name'}
                  </button>
                </form>
              )}
            </>
          )}
        </div>

        {/* Danger Zone */}
        {currentQr && (
          <div
            className="card"
            style={{
              maxWidth: 640,
              marginBottom: '1.5rem',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              background: 'rgba(239, 68, 68, 0.03)',
            }}
          >
            <div className="flex items-center gap-2" style={{ fontWeight: 700, color: 'var(--accent-red)', marginBottom: '1.25rem' }}>
              <AlertTriangle size={18} />
              Danger Zone
            </div>

            <div className="flex justify-between items-center flex-wrap gap-3" style={{ marginBottom: '1.25rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>
                  {currentQr.is_enabled ? 'Disable QR Code' : 'Enable QR Code'}
                </div>
                <div className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>
                  {currentQr.is_enabled
                    ? 'Scanners will receive a friendly 404 "Link Unavailable" page until re-enabled.'
                    : 'Currently disabled. Click to re-enable redirects for this QR code.'}
                </div>
              </div>
              <button
                type="button"
                className={`btn btn-sm flex items-center gap-1.5 ${currentQr.is_enabled ? 'btn-ghost' : 'btn-primary'}`}
                onClick={handleToggleStatus}
              >
                <Power size={13} />
                {currentQr.is_enabled ? 'Disable QR' : 'Enable QR'}
              </button>
            </div>

            <div className="flex justify-between items-center flex-wrap gap-3">
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent-red)' }}>
                  Delete QR Code
                </div>
                <div className="text-xs text-muted" style={{ marginTop: '0.2rem' }}>
                  Permanently delete "{currentQr.name}" and all attached links and scan logs. This cannot be undone.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-danger btn-sm flex items-center gap-1.5"
                onClick={handleRequestDelete}
              >
                <Trash2 size={13} />
                Delete QR
              </button>

            </div>
          </div>
        )}

        {/* Environment & Quick Reference */}
        <div className="card" style={{ maxWidth: 640 }}>
          <div style={{ fontWeight: 700, marginBottom: '1.25rem' }}>Environment</div>
          <table>
            <tbody>
              <tr><td className="text-muted text-sm">API URL</td><td className="font-mono text-sm">{apiUrl}</td></tr>
              <tr><td className="text-muted text-sm">Supabase URL</td><td className="font-mono text-sm">{supUrl}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Centered QR Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteModal}
        title="Delete QR Code Permanently?"
        message={`Are you sure you want to delete "${currentQr?.name}"? All destination links and scan analytics will be permanently destroyed.`}
        confirmText="Yes, Delete QR"
        cancelText="Cancel"
        isDanger={true}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setShowDeleteModal(false)}
      />
    </>
  )
}

