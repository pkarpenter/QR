import { useState } from 'react'
import { Copy, Check, ExternalLink } from 'lucide-react'
import QRDownloadButton from './QRDownloadButton'

export default function QRPreview({ qr }) {
  const [copied, setCopied] = useState(false)
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  if (!qr) return null

  const imageUrl = `${BASE}/api/qr/${qr.id}/image?format=png`

  function copyUrl() {
    navigator.clipboard.writeText(qr.redirect_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card qr-preview-card" style={{ padding: '1.25rem' }}>
      <div className="flex flex-col items-center text-center">
        <div
          style={{
            background: '#ffffff',
            padding: '12px',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
            marginBottom: '1rem',
          }}
        >
          <img
            src={imageUrl}
            alt={qr.name}
            style={{ width: 140, height: 140, display: 'block' }}
          />
        </div>

        <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
          {qr.name}
        </div>
        <div className="font-mono text-xs text-muted" style={{ marginBottom: '1rem' }}>
          /go/{qr.slug}
        </div>

        <div className="flex gap-2 w-full justify-center">
          <button
            type="button"
            className="btn btn-ghost btn-sm flex items-center gap-1.5"
            onClick={copyUrl}
            title="Copy QR Short URL"
          >
            {copied ? <Check size={14} color="var(--accent-green)" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>
          <QRDownloadButton qrId={qr.id} />
        </div>
      </div>
    </div>
  )
}
