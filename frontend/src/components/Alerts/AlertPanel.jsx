import React from 'react'
import { AlertTriangle, AlertOctagon, Clock } from 'lucide-react'

function timeAgo(iso) {
  try {
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
    if (diff < 60)  return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff/60)}m ago`
    return `${Math.floor(diff/3600)}h ago`
  } catch { return '' }
}

export default function AlertPanel({ alerts = [] }) {
  const sorted = [...alerts].sort((a, b) => {
    const order = { Critical: 0, Warning: 1 }
    return (order[a.severity] ?? 2) - (order[b.severity] ?? 2)
  })

  return (
    <div className="glass-card p-4 flex flex-col gap-3 h-full">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <AlertOctagon size={15} className="text-red-400" />
          Live Alerts
        </h3>
        <span className="text-[10px] text-slate-500">{alerts.length} total</span>
      </div>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-64 pr-1">
        {sorted.length === 0 ? (
          <div className="text-center py-8 text-slate-600 text-sm">
            <AlertTriangle size={24} className="mx-auto mb-2 opacity-30" />
            All systems nominal
          </div>
        ) : (
          sorted.slice(0, 30).map((alert, i) => {
            const severity = alert.priority || alert.severity || 'Warning'
            const message  = alert.title || alert.message || 'Anomaly detected'
            const isCrit   = severity === 'CRITICAL' || severity === 'Critical'
            
            return (
              <div key={alert.id || i}
                className={`alert-item ${isCrit ? 'critical' : 'warning'}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <AlertTriangle size={11}
                      style={{ color: isCrit ? '#ef4444' : '#f59e0b', flexShrink: 0, marginTop: 1 }} />
                    <span className="text-[11px] text-slate-200 leading-snug">{message}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={`status-badge ${isCrit ? 'badge-critical' : 'badge-warning'}`}
                    style={{ fontSize: '9px', padding: '1px 6px' }}>
                    {severity}
                  </span>
                  <span className="text-[10px] text-slate-600 flex items-center gap-1">
                    <Clock size={9} /> {timeAgo(alert.timestamp)}
                  </span>
                  {alert.equipment_name && (
                    <span className="text-[10px] text-slate-500">{alert.equipment_name}</span>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
