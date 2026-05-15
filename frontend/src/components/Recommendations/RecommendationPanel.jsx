import React from 'react'
import { Wrench, ChevronRight, Zap } from 'lucide-react'

const PRIORITY_STYLES = {
  CRITICAL: { cls: 'priority-critical', dot: '#ef4444' },
  HIGH:     { cls: 'priority-high',     dot: '#f97316' },
  MEDIUM:   { cls: 'priority-medium',   dot: '#f59e0b' },
  LOW:      { cls: 'priority-low',      dot: '#10b981' },
}

export default function RecommendationPanel({ recommendations = [] }) {
  // Deduplicate by title+equipment
  const seen = new Set()
  const unique = recommendations.filter(r => {
    const key = `${r.equipment_id}-${r.title}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  // Sort by priority
  const order = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }
  const sorted = [...unique].sort((a, b) => (order[a.priority] ?? 4) - (order[b.priority] ?? 4))

  return (
    <div className="glass-card p-4 flex flex-col gap-3 h-full">
      <h3 className="text-sm font-semibold text-white flex items-center gap-2">
        <Wrench size={15} className="text-blue-400" />
        AI Recommendations
      </h3>

      <div className="flex flex-col gap-2 overflow-y-auto max-h-72 pr-1">
        {sorted.length === 0 ? (
          <div className="text-center py-8 text-slate-600 text-sm">
            <Zap size={24} className="mx-auto mb-2 opacity-30" />
            Analysing equipment…
          </div>
        ) : (
          sorted.slice(0, 15).map((rec, i) => {
            const pStyle = PRIORITY_STYLES[rec.priority] || PRIORITY_STYLES.LOW
            return (
              <div key={i} className="flex flex-col gap-1.5 p-3 rounded-xl animate-fade-in"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0 mt-0.5" style={{ background: pStyle.dot }} />
                    <p className="text-xs font-semibold text-white leading-snug">{rec.title}</p>
                  </div>
                  <span className={`status-badge ${pStyle.cls} shrink-0`}
                    style={{ fontSize: '9px', padding: '1px 6px' }}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed pl-4">{rec.description}</p>
                {rec.equipment_name && (
                  <p className="text-[10px] text-slate-600 pl-4 flex items-center gap-1">
                    <ChevronRight size={10} /> {rec.equipment_name}
                  </p>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
