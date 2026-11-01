import { useState } from 'react'
import { Download, Loader2, Image, FileCode } from 'lucide-react'

export default function QRDownloadButton({ qrId }) {
  const [open, setOpen] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

  function downloadUrl(fmt) {
    return `${BASE}/api/qr/${qrId}/download?fmt=${fmt}`
  }

  async function handleDownload(fmt) {
    setOpen(false)
    setDownloading(true)
    try {
      const res = await fetch(downloadUrl(fmt))
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const blobUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = `qr_${qrId}.${fmt}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(blobUrl)
    } catch (err) {
      console.error('Download error:', err)
      window.open(downloadUrl(fmt), '_blank')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="qr-download-menu">
      <button
        className="btn btn-ghost btn-sm flex items-center gap-1.5"
        onClick={() => setOpen(o => !o)}
        id={`qr-download-${qrId}`}
        disabled={downloading}
      >
        {downloading ? (
          <>
            <Loader2 size={13} className="spin" />
            Downloading...
          </>
        ) : (
          <>
            <Download size={13} />
            Download
          </>
        )}
      </button>
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div className="qr-dropdown">
            <button
              type="button"
              className="btn btn-ghost flex items-center gap-2"
              style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => handleDownload('png')}
            >
              <Image size={15} color="var(--accent)" />
              PNG Image
            </button>
            <button
              type="button"
              className="btn btn-ghost flex items-center gap-2"
              style={{ width: '100%', justifyContent: 'flex-start', textAlign: 'left', cursor: 'pointer' }}
              onClick={() => handleDownload('svg')}
            >
              <FileCode size={15} color="var(--accent-cyan)" />
              SVG Vector
            </button>
          </div>
        </>
      )}
    </div>
  )
}


