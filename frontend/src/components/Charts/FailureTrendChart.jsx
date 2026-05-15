import React from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Cell, Legend
} from 'recharts'

export default function FailureTrendChart({ predictions = [] }) {
  // Bucket predictions into 10-point windows
  const bucketed = []
  const step = Math.max(1, Math.floor(predictions.length / 12))
  for (let i = 0; i < predictions.length; i += step) {
    const slice  = predictions.slice(i, i + step)
    const label  = slice[0]?.timestamp
      ? new Date(slice[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : `#${i}`
    const counts = { Healthy: 0, Warning: 0, Critical: 0 }
    slice.forEach(p => { if (counts[p.risk_label] !== undefined) counts[p.risk_label]++ })
    bucketed.push({ time: label, ...counts })
  }

  if (!bucketed.length) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-600 text-sm">
        No prediction data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={bucketed} barSize={8} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
        <CartesianGrid stroke="rgba(255,255,255,0.04)" strokeDasharray="3 3" />
        <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#475569' }} tickLine={false} axisLine={false} />
        <Tooltip
          contentStyle={{ background: 'rgba(13,21,38,0.95)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, fontSize: 11 }}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Legend wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
        <Bar dataKey="Healthy"  fill="#10b981" radius={[2,2,0,0]} />
        <Bar dataKey="Warning"  fill="#f59e0b" radius={[2,2,0,0]} />
        <Bar dataKey="Critical" fill="#ef4444" radius={[2,2,0,0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
