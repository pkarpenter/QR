import axios from 'axios'
import { supabase } from './supabase'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({ baseURL: BASE })

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

// ─── QR Codes ───────────────────────────────────────────────
export const getQrCodes       = ()                => api.get('/api/qr').then(r => r.data)
export const getQrDetail      = (id)              => api.get(`/api/qr/${id}`).then(r => r.data)
export const createQrCode     = (name)            => api.post('/api/qr', { name }).then(r => r.data)
export const updateQrCode     = (id, name)        => api.patch(`/api/qr/${id}`, { name }).then(r => r.data)
export const deleteQrCode     = (id)              => api.delete(`/api/qr/${id}`)
export const toggleQrCode     = (id)              => api.patch(`/api/qr/${id}/toggle`).then(r => r.data)
export const getQrImageUrl    = (id, fmt = 'png') => `${BASE}/api/qr/${id}/image?format=${fmt}`
export const getQrDownloadUrl = (id, fmt = 'png') => `${BASE}/api/qr/${id}/download?fmt=${fmt}`

// ─── Links ──────────────────────────────────────────────────
export const getLinks         = (qrId)            => api.get(`/api/qr/${qrId}/links`).then(r => r.data)
export const addLink          = (qrId, data)      => api.post(`/api/qr/${qrId}/links`, data).then(r => r.data)
export const updateLink       = (qrId, id, data)  => api.patch(`/api/qr/${qrId}/links/${id}`, data).then(r => r.data)
export const updateLinkDirect = (id, data)        => api.put(`/api/links/${id}`, data).then(r => r.data)
export const deleteLink       = (qrId, id)        => api.delete(`/api/qr/${qrId}/links/${id}`)
export const deleteLinkDirect = (id)              => api.delete(`/api/links/${id}`)
export const activateLink     = (qrId, id)        => api.post(`/api/qr/${qrId}/links/${id}/activate`).then(r => r.data)

// ─── Analytics ──────────────────────────────────────────────
export const getAnalytics     = (qrId, days = 30) => api.get(`/api/qr/${qrId}/analytics?days=${days}`).then(r => r.data)
export const getQrScans       = (qrId, limit = 50)=> api.get(`/api/qr/${qrId}/scans?limit=${limit}`).then(r => r.data)
export const getDashboardStats= ()                => api.get('/api/dashboard/stats').then(r => r.data)
export const getExportUrl     = (qrId)            => `${BASE}/api/qr/${qrId}/scans/export`

// ─── Multi-Link Mode ────────────────────────────────────────
export const getMultiLinkConfig  = (qrId)         => api.get(`/api/qr/${qrId}/multi-link-config`).then(r => r.data)
export const saveMultiLinkConfig = (qrId, data)   => api.post(`/api/qr/${qrId}/multi-link-config`, data).then(r => r.data)

