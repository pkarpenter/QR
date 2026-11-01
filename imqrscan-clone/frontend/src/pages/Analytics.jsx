import { useEffect, useState } from 'react'
import {
  Download, BarChart3, Calendar, Users, Clock,
  Globe, Building2, Smartphone, Compass
} from 'lucide-react'
import Topbar from '../components/Layout/Topbar'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { getQrCodes, getAnalytics, getExportUrl } from '../lib/api'

export default function Analytics() {
  const [qrCodes,   setQrCodes]   = useState([])
  const [selected,  setSelected]  = useState('')
  const [days,      setDays]      = useState(30)
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(false)

  useEffect(() => {
    getQrCodes().then(list => {
      setQrCodes(list)
      if (list.length) setSelected(list[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selected) return
    setLoading(true)
    getAnalytics(selected, days)
      .then(setData)
      .finally(() => setLoading(false))
  }, [selected, days])

  return (
    <>
      <Topbar
        title="Analytics"
        subtitle="Deep dive into scan behaviour"
        actions={
          selected && (
            <a
              href={getExportUrl(selected)}
              download
              className="btn btn-ghost btn-sm flex items-center gap-1.5"
            >
              <Download size={14} />
              Export CSV
            </a>
          )
        }
      />
      <div className="page-body">
        {/* Filters */}
        <div className="card flex gap-3 items-center" style={{ marginBottom: '1.25rem', padding: '1rem 1.5rem' }}>
          <div className="form-group" style={{ flex: 1 }}>
            <label>QR Code</label>
            <select value={selected} onChange={e => setSelected(e.target.value)}>
              {qrCodes.map(q => <option key={q.id} value={q.id}>{q.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Period</label>
            <select value={days} onChange={e => setDays(+e.target.value)}>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
              <option value={365}>Last year</option>
            </select>
          </div>
        </div>

        {loading && <div style={{ textAlign: 'center', padding: '3rem' }}><span className="spinner" /></div>}

        {data && !loading && (
          <>
            {/* KPIs */}
            <div className="kpi-grid" style={{ marginBottom: '1.25rem' }}>
              <div className="kpi-card" style={{ '--kpi-color': 'var(--accent)' }}>
                <div className="kpi-icon"><BarChart3 size={22} /></div>
                <div className="kpi-value">{data.total}</div>
                <div className="kpi-label">Total Scans</div>
              </div>
              <div className="kpi-card" style={{ '--kpi-color': 'var(--accent-cyan)' }}>
                <div className="kpi-icon"><Calendar size={22} /></div>
                <div className="kpi-value">{data.today}</div>
                <div className="kpi-label">Today</div>
              </div>
              <div className="kpi-card" style={{ '--kpi-color': 'var(--accent-green)' }}>
                <div className="kpi-icon"><Users size={22} /></div>
                <div className="kpi-value">{data.unique_visitors}</div>
                <div className="kpi-label">Unique Visitors</div>
              </div>
            </div>

            {/* Hour Histogram */}
            <div className="chart-card" style={{ marginBottom: '1.25rem' }}>
              <div className="chart-title flex items-center gap-2">
                <Clock size={16} color="var(--accent)" />
                Scans by Hour of Day
              </div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.hour_histogram} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
                  <XAxis dataKey="hour" tick={{ fill: '#9095a8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#9095a8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#161820', border: '1px solid #2a2d3a', borderRadius: 8 }} itemStyle={{ color: '#6366f1' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Country & City Tables */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <BreakdownTable
                icon={<Globe size={16} color="var(--accent)" />}
                title="Top Countries"
                data={data.scans_by_country}
              />
              <BreakdownTable
                icon={<Building2 size={16} color="var(--accent-2)" />}
                title="Top Cities"
                data={data.scans_by_city}
              />
              <BreakdownTable
                icon={<Smartphone size={16} color="var(--accent-cyan)" />}
                title="Devices"
                data={data.scans_by_device}
              />
              <BreakdownTable
                icon={<Compass size={16} color="var(--accent-green)" />}
                title="Browsers"
                data={data.scans_by_browser}
              />
            </div>
          </>
        )}
      </div>
    </>
  )
}

function BreakdownTable({ icon, title, data = [] }) {
  return (
    <div className="card">
      <div className="chart-title flex items-center gap-2" style={{ marginBottom: '1rem' }}>
        {icon}
        {title}
      </div>

      {data.length === 0
        ? <div className="text-muted text-sm">No data</div>
        : (
          <table>
            <tbody>
              {data.slice(0, 8).map((row, i) => (
                <tr key={i}>
                  <td style={{ fontWeight: 500 }}>{row.label || 'Unknown'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{
                      background: 'rgba(99,102,241,.15)',
                      color: 'var(--accent)',
                      padding: '.15rem .5rem',
                      borderRadius: '99px',
                      fontSize: '.75rem',
                      fontWeight: 700
                    }}>{row.count}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      }
    </div>
  )
}
