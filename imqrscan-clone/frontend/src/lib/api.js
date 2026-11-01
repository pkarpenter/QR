import axios from 'axios'
import { supabase } from './supabase'

const envBase = import.meta.env.VITE_API_URL
const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
// If we are on HTTPS (e.g. Vercel) and no custom HTTPS API is set, don't default to http://localhost
const BASE = envBase || (isHttps ? '' : 'http://localhost:8000')

const api = axios.create({ baseURL: BASE || undefined })

// Attach Supabase JWT on every request with auto-refresh
api.interceptors.request.use(async (config) => {
  try {
    let { data: { session } } = await supabase.auth.getSession()

    // If session token has expired, refresh it
    if (session) {
      const nowSeconds = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < nowSeconds + 60) {
        const { data: refreshed, error } = await supabase.auth.refreshSession()
        if (!error && refreshed?.session) {
          session = refreshed.session
        }
      }
      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`
      }
    }
  } catch (e) {
    console.warn('Error reading/refreshing session:', e)
  }
  return config
})

// Handle 401 responses by refreshing and retrying once
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const { data: refreshed, error: refreshErr } = await supabase.auth.refreshSession()
        if (!refreshErr && refreshed?.session?.access_token) {
          originalRequest.headers.Authorization = `Bearer ${refreshed.session.access_token}`
          return api(originalRequest)
        }
      } catch (err) {
        console.warn('Auto refresh failed:', err)
      }
    }
    return Promise.reject(error)
  }
)

export default api

// Helper to generate unique random slug
function generateSlug(length = 8) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

// ─── QR Codes ───────────────────────────────────────────────
export const getQrCodes = async () => {
  if (BASE) {
    try {
      const res = await api.get('/api/qr')
      return res.data
    } catch (err) {
      console.warn('Backend /api/qr unreachable, using direct Supabase fallback:', err.message)
    }
  }
  
  // Direct Supabase Fallback
  const { data: qrs, error } = await supabase
    .table('qr_codes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error

  // Fetch active links and scans in parallel
  const [{ data: links }, { data: scans }] = await Promise.all([
    supabase.table('links').select('id, qr_id, title, url').eq('is_active', true),
    supabase.table('scans').select('qr_id')
  ])

  const activeMap = {}
  if (links) {
    links.forEach(l => { activeMap[l.qr_id] = l })
  }
  const scanCounts = {}
  if (scans) {
    scans.forEach(s => {
      scanCounts[s.qr_id] = (scanCounts[s.qr_id] || 0) + 1
    })
  }

  return (qrs || []).map(q => ({
    ...q,
    active_link_title: activeMap[q.id]?.title || null,
    active_link_url: activeMap[q.id]?.url || null,
    total_scans: scanCounts[q.id] || 0,
  }))
}

export const getQrDetail = async (id) => {
  if (BASE) {
    try {
      const res = await api.get(`/api/qr/${id}`)
      return res.data
    } catch (err) {
      console.warn('Backend /api/qr/:id unreachable, using Supabase fallback')
    }
  }
  const { data: qr, error } = await supabase.table('qr_codes').select('*').eq('id', id).single()
  if (error) throw error
  const [{ data: links }, { count: total_scans }] = await Promise.all([
    supabase.table('links').select('*').eq('qr_id', id).eq('is_active', true).limit(1),
    supabase.table('scans').select('id', { count: 'exact', head: true }).eq('qr_id', id)
  ])
  return {
    ...qr,
    active_link: links?.[0] || null,
    total_scans: total_scans || 0,
  }
}

export const createQrCode = async (name, description = '') => {
  const safeDesc = (description || '').slice(0, 2500)
  if (BASE) {
    try {
      const res = await api.post('/api/qr', { name, description: safeDesc })
      return res.data
    } catch (err) {
      console.warn('Backend /api/qr POST unreachable, using direct Supabase fallback:', err.message)
    }
  }

  // Direct Supabase Fallback
  const slug = generateSlug(8)
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://imqrscan.com'
  const redirect_url = `${origin}/go/${slug}`

  let insertData = {
    name,
    description: safeDesc,
    slug,
    redirect_url,
    is_enabled: true,
  }

  let { data, error } = await supabase
    .table('qr_codes')
    .insert(insertData)
    .select()
    .single()

  // If Supabase table does not yet have 'description' column
  if (error && error.message && error.message.includes('description')) {
    delete insertData.description
    const retry = await supabase
      .table('qr_codes')
      .insert(insertData)
      .select()
      .single()
    if (retry.error) throw retry.error
    data = retry.data
  } else if (error) {
    throw error
  }

  if (data && safeDesc) {
    data.description = safeDesc
    try {
      localStorage.setItem(`qr_desc_${data.id}`, safeDesc)
    } catch {}
  }

  return data
}

export const updateQrCode = async (id, name) => {
  if (BASE) {
    try {
      const res = await api.patch(`/api/qr/${id}`, { name })
      return res.data
    } catch (err) {
      console.warn('Backend /api/qr/:id PATCH unreachable, using Supabase fallback')
    }
  }
  const { data, error } = await supabase.table('qr_codes').update({ name }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const deleteQrCode = async (id) => {
  if (BASE) {
    try {
      return await api.delete(`/api/qr/${id}`)
    } catch (err) {
      console.warn('Backend /api/qr/:id DELETE unreachable, using Supabase fallback')
    }
  }
  const { error } = await supabase.table('qr_codes').delete().eq('id', id)
  if (error) throw error
}

export const toggleQrCode = async (id) => {
  if (BASE) {
    try {
      const res = await api.patch(`/api/qr/${id}/toggle`)
      return res.data
    } catch (err) {}
  }
  const { data: current } = await supabase.table('qr_codes').select('is_enabled').eq('id', id).single()
  const nextVal = !current?.is_enabled
  const { data, error } = await supabase.table('qr_codes').update({ is_enabled: nextVal }).eq('id', id).select().single()
  if (error) throw error
  return data
}

export const getQrImageUrl = (id, fmt = 'png') => {
  if (BASE && !BASE.includes('localhost')) {
    return `${BASE}/api/qr/${id}/image?format=${fmt}`
  }
  // Safe SVG / PNG QR generator fallback
  return `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(id)}`
}

export const getQrDownloadUrl = (id, fmt = 'png') => {
  if (BASE && !BASE.includes('localhost')) {
    return `${BASE}/api/qr/${id}/download?fmt=${fmt}`
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=1024x1024&format=${fmt}&data=${encodeURIComponent(id)}`
}

// ─── Links ──────────────────────────────────────────────────
export const getLinks = async (qrId) => {
  if (BASE) {
    try {
      const res = await api.get(`/api/qr/${qrId}/links`)
      return res.data
    } catch (err) {}
  }
  const { data, error } = await supabase
    .table('links')
    .select('*')
    .eq('qr_id', qrId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data || []
}

export const addLink = async (qrId, data) => {
  if (BASE) {
    try {
      const res = await api.post(`/api/qr/${qrId}/links`, data)
      return res.data
    } catch (err) {}
  }
  const { data: existing } = await supabase.table('links').select('id').eq('qr_id', qrId)
  const isFirst = !existing || existing.length === 0
  const { data: created, error } = await supabase
    .table('links')
    .insert({
      qr_id: qrId,
      title: data.title,
      url: data.url,
      is_active: isFirst,
    })
    .select()
    .single()
  if (error) throw error
  return created
}

export const updateLink = async (qrId, id, data) => {
  if (BASE) {
    try {
      const res = await api.patch(`/api/qr/${qrId}/links/${id}`, data)
      return res.data
    } catch (err) {}
  }
  const { data: updated, error } = await supabase
    .table('links')
    .update(data)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return updated
}

export const updateLinkDirect = (id, data) => updateLink(null, id, data)

export const deleteLink = async (qrId, id) => {
  if (BASE) {
    try {
      return await api.delete(`/api/qr/${qrId}/links/${id}`)
    } catch (err) {}
  }
  const { error } = await supabase.table('links').delete().eq('id', id)
  if (error) throw error
}

export const deleteLinkDirect = (id) => deleteLink(null, id)

export const activateLink = async (qrId, id) => {
  if (BASE) {
    try {
      const res = await api.post(`/api/qr/${qrId}/links/${id}/activate`)
      return res.data
    } catch (err) {}
  }
  await supabase.rpc('activate_link', { p_qr_id: qrId, p_link_id: id })
  const { data } = await supabase.table('links').select('*').eq('id', id).single()
  return data
}

// ─── Analytics ──────────────────────────────────────────────
export const getAnalytics = async (qrId, days = 30) => {
  if (BASE) {
    try {
      const res = await api.get(`/api/qr/${qrId}/analytics?days=${days}`)
      return res.data
    } catch (err) {}
  }
  const { data: scans } = await supabase.table('scans').select('*').eq('qr_id', qrId)
  return {
    total_scans: (scans || []).length,
    scans_by_date: {},
    top_devices: {},
    top_browsers: {},
    top_countries: {},
  }
}

export const getQrScans = async (qrId, limit = 50) => {
  if (BASE) {
    try {
      const res = await api.get(`/api/qr/${qrId}/scans?limit=${limit}`)
      return res.data
    } catch (err) {}
  }
  const { data, error } = await supabase
    .table('scans')
    .select('*')
    .eq('qr_id', qrId)
    .order('scanned_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data || []
}

export const getDashboardStats = async () => {
  if (BASE) {
    try {
      const res = await api.get('/api/dashboard/stats')
      return res.data
    } catch (err) {}
  }
  const [{ data: qrs }, { data: links }, { data: scans }] = await Promise.all([
    supabase.table('qr_codes').select('id'),
    supabase.table('links').select('id').eq('is_active', true),
    supabase.table('scans').select('id, scanned_at'),
  ])

  const total_scans = (scans || []).length
  const today = new Date().toISOString().split('T')[0]
  const today_scans = (scans || []).filter(s => s.scanned_at && s.scanned_at.startsWith(today)).length

  return {
    active_qrs: (qrs || []).length,
    active_links: (links || []).length,
    total_scans,
    today_scans,
  }
}

export const getExportUrl = (qrId) => `${BASE}/api/qr/${qrId}/scans/export`

// ─── Multi-Link Mode ────────────────────────────────────────
export const getMultiLinkConfig = async (qrId) => {
  if (BASE) {
    try {
      const res = await api.get(`/api/qr/${qrId}/multi-link-config`)
      return res.data
    } catch (err) {}
  }
  try {
    const raw = localStorage.getItem(`multi_link_config_${qrId}`)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { is_multi_link: false, active_link_ids: [] }
}

export const saveMultiLinkConfig = async (qrId, data) => {
  if (BASE) {
    try {
      const res = await api.post(`/api/qr/${qrId}/multi-link-config`, data)
      return res.data
    } catch (err) {}
  }
  try {
    localStorage.setItem(`multi_link_config_${qrId}`, JSON.stringify(data))
  } catch {}
  return data
}
