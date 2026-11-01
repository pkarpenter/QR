import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Smartphone } from 'lucide-react'

const COLORS = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

export default function DeviceSplit({ data = [] }) {
  const chart = data.map(d => ({ name: d.label, value: d.count }))

  return (
    <div className="chart-card">
      <div className="chart-title flex items-center gap-2">
        <Smartphone size={16} color="var(--accent-2)" />
        Device Split
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <PieChart>
          <Pie
            data={chart}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={3}
            dataKey="value"
          >
            {chart.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{ background: '#161820', border: '1px solid #2a2d3a', borderRadius: 8 }}
            itemStyle={{ color: '#f1f2f7' }}
          />
          <Legend
            formatter={(v) => <span style={{ color: '#9095a8', fontSize: 12 }}>{v}</span>}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
