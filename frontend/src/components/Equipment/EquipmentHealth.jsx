import React from 'react'
import { Heart, Cpu } from 'lucide-react'

function HealthRing({ score }) {
  const size = 80
  const stroke = 6
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const progress = ((100 - score) / 100) * circ
  const color = score >= 75 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444'

  return (
    <svg width={size} height={size}>
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={progress}
        strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`}
        style={{ transition: 'stroke-dashoffset 0.8s ease, stroke 0.4s ease' }}
      />
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill={color} fontSize="14" fontWeight="700" fontFamily="Inter">
        {score}%
      </text>
    </svg>
  )
}

const RISK_BADGE = {
  Healthy:  'badge-healthy',
  Warning:  'badge-warning',
  Critical: 'badge-critical',
}

export default function EquipmentHealth({ equipmentList = [] }) {
  return (
    <div className="glass-card p-4 flex flex-col gap-4">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Heart size={15} className="text-pink-400" />
        Equipment Health
      </h3>

      <div className="grid grid-cols-2 gap-3">
        {equipmentList.length === 0
          ? [1,2,3,4].map(i => (
              <div key={i} className="flex flex-col items-center gap-2 p-3 rounded-xl animate-pulse"
                style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="w-20 h-20 rounded-full bg-slate-800" />
                <div className="h-3 w-16 bg-slate-800 rounded" />
              </div>
            ))
          : equipmentList.map(eq => {
              const pred    = eq.prediction || {}
              const score   = pred.health_score ?? 100
              const label   = pred.risk_label || 'Healthy'
              const name    = eq.sensor?.equipment_name || pred.equipment_name || '---'
              const conf    = pred.confidence ?? 0

              return (
                <div key={eq.sensor?.equipment_id}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <HealthRing score={score} />
                  <div className="text-center">
                    <p className="text-xs font-semibold text-white truncate max-w-[100px]">{name}</p>
                    <span className={`status-badge ${RISK_BADGE[label] || 'badge-healthy'} mt-1`}
                      style={{ fontSize: '9px', padding: '1px 6px' }}>
                      {label}
                    </span>
                    <p className="text-[9px] text-slate-600 mt-1">Conf: {conf}%</p>
                  </div>
                </div>
              )
            })
        }
      </div>
    </div>
  )
}
