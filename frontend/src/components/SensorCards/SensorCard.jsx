import React, { useRef, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const STATUS_CLASSES = {
  Healthy:  'glow-healthy',
  Warning:  'glow-warning',
  Critical: 'glow-critical',
}
const BADGE_CLASSES = {
  Healthy:  'badge-healthy',
  Warning:  'badge-warning',
  Critical: 'badge-critical',
}

function Sparkline({ data = [], color }) {
  const canvas = useRef(null)

  useEffect(() => {
    if (!canvas.current || data.length < 2) return
    const ctx  = canvas.current.getContext('2d')
    const w    = canvas.current.width
    const h    = canvas.current.height
    const vals = data.map(d => d.value)
    const min  = Math.min(...vals)
    const max  = Math.max(...vals)
    const range = max - min || 1

    ctx.clearRect(0, 0, w, h)

    // Gradient fill
    const grad = ctx.createLinearGradient(0, 0, 0, h)
    grad.addColorStop(0, color + '55')
    grad.addColorStop(1, color + '00')

    ctx.beginPath()
    vals.forEach((v, i) => {
      const x = (i / (vals.length - 1)) * w
      const y = h - ((v - min) / range) * (h - 4) - 2
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    })
    ctx.strokeStyle = color
    ctx.lineWidth   = 1.5
    ctx.stroke()

    // Fill below line
    ctx.lineTo(w, h); ctx.lineTo(0, h)
    ctx.closePath()
    ctx.fillStyle = grad
    ctx.fill()
  }, [data, color])

  return <canvas ref={canvas} width={80} height={30} className="opacity-80" />
}

export default function SensorCard({ label, value, unit, icon: Icon, color, status = 'Healthy', history = [] }) {
  const prevVal = useRef(value)
  const trend   = value > prevVal.current ? 'up' : value < prevVal.current ? 'down' : 'flat'
  useEffect(() => { prevVal.current = value }, [value])

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus

  return (
    <div className={`glass-card p-4 flex flex-col gap-3 ${STATUS_CLASSES[status] || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: `${color}1a`, border: `1px solid ${color}33` }}>
            <Icon size={16} style={{ color }} />
          </div>
          <span className="text-xs font-medium text-slate-400">{label}</span>
        </div>
        <span className={`status-badge ${BADGE_CLASSES[status] || 'badge-healthy'}`}>
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'currentColor' }} />
          {status}
        </span>
      </div>

      {/* Value */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="sensor-value text-3xl font-bold tracking-tight"
              style={{ color, fontFamily: "'JetBrains Mono', monospace" }}>
              {value !== undefined ? (typeof value === 'number' ? value.toFixed(value < 10 ? 2 : 1) : value) : '--'}
            </span>
            <span className="text-sm text-slate-500 font-medium">{unit}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <TrendIcon size={11} style={{ color: trend === 'up' ? '#ef4444' : trend === 'down' ? '#10b981' : '#64748b' }} />
            <span className="text-[10px] text-slate-500">vs prev reading</span>
          </div>
        </div>
        <Sparkline data={history} color={color} />
      </div>
    </div>
  )
}
