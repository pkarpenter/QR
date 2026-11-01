import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import { TrendingUp } from 'lucide-react'

export default function ScansChart({ data = [] }) {
  return (
    <div className="chart-card">
      <div className="chart-title flex items-center gap-2">
        <TrendingUp size={16} color="var(--accent)" />
        Scans Over Time
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="scanGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
          <XAxis dataKey="hour" tick={{ fill: '#9095a8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: '#9095a8', fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: '#161820', border: '1px solid #2a2d3a', borderRadius: 8 }}
            labelStyle={{ color: '#9095a8' }}
            itemStyle={{ color: '#6366f1' }}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="#6366f1"
            strokeWidth={2}
            fill="url(#scanGrad)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
