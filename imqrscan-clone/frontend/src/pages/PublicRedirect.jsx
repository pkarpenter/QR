import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function PublicRedirect() {
  const { slug } = useParams()
  const [status, setStatus] = useState('loading') // 'loading' | 'inactive' | 'not_found' | 'no_link'
  const [qrName, setQrName] = useState('')

  useEffect(() => {
    async function handleRedirect() {
      try {
        const { data: qr, error } = await supabase
          .table('qr_codes')
          .select('id, name, slug, is_enabled')
          .eq('slug', slug)
          .single()

        if (error || !qr) {
          setStatus('not_found')
          return
        }

        setQrName(qr.name)

        // Check if QR code is activated
        if (qr.is_enabled === false) {
          setStatus('inactive')
          return
        }

        // Fetch active destination link
        const { data: links } = await supabase
          .table('links')
          .select('id, url, is_active')
          .eq('qr_id', qr.id)
          .eq('is_active', true)

        if (links && links.length > 0 && links[0].url) {
          // Log scan in background
          try {
            await supabase.table('scans').insert({
              qr_id: qr.id,
              link_id: links[0].id,
            })
          } catch {}

          window.location.replace(links[0].url)
        } else {
          setStatus('no_link')
        }
      } catch (err) {
        console.error('Redirect error:', err)
        setStatus('not_found')
      }
    }

    if (slug) {
      handleRedirect()
    }
  }, [slug])

  if (status === 'loading') {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: '#090d16',
        color: '#f8fafc',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div className="spinner" style={{ width: 36, height: 36, borderTopColor: '#06b6d4' }} />
        <p style={{ marginTop: '1.25rem', color: '#94a3b8', fontSize: '0.95rem' }}>
          Resolving secure dynamic redirect...
        </p>
      </div>
    )
  }

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: '#090d16',
      color: '#f8fafc',
      fontFamily: 'Inter, sans-serif',
      padding: '1.5rem',
    }}>
      <div style={{
        background: '#0f172a',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '1.25rem',
        padding: '3rem 2rem',
        maxWidth: 440,
        width: '100%',
        textAlign: 'center',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      }}>
        {status === 'inactive' ? (
          <>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.12)',
              color: '#ef4444',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              marginBottom: '1.25rem',
            }}>
              🚫
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.65rem' }}>
              QR Code Not Active
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6 }}>
              {qrName ? <strong>{qrName}</strong> : 'This QR code'} is currently <strong>deactivated</strong> by its owner.
              <br />
              Please contact the administrator or check back later.
            </p>
          </>
        ) : status === 'no_link' ? (
          <>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.12)',
              color: '#f59e0b',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              marginBottom: '1.25rem',
            }}>
              🔗
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.65rem' }}>
              No Destination Link
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6 }}>
              This QR code is active, but does not have a destination URL assigned yet.
            </p>
          </>
        ) : (
          <>
            <div style={{
              width: 58,
              height: 58,
              borderRadius: '50%',
              background: 'rgba(148, 163, 184, 0.12)',
              color: '#94a3b8',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              marginBottom: '1.25rem',
            }}>
              ❓
            </div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.65rem' }}>
              QR Code Not Found
            </h1>
            <p style={{ color: '#94a3b8', fontSize: '0.92rem', lineHeight: 1.6 }}>
              The dynamic link you requested does not exist or has expired.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
