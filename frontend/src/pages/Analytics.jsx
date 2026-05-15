import React, { useEffect, useState } from 'react'
import { fetchAnalytics, fetchPredictions } from '../services/api'
import FailureTrendChart from '../components/Charts/FailureTrendChart'
import { BarChart2, Activity, TrendingUp, AlertOctagon } from 'lucide-react'

export default function Analytics() {
  const [analytics, setAnalytics] = useState(null)
  const [predictions, setPredictions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [a, p] = await Promise.all([fetchAnalytics(), fetchPredictions(200)])
        setAnalytics(a.data)
        setPredictions(p.data.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
    const interval = setInterval(load, 10000)
    return () => clearInterval(interval)
  }, [])

  const summary = analytics?.summary || {}
  const health  = analytics?.equipment_health || []

  return (
    <div className="p-6 flex flex-col gap-6 page-enter">
      <div className="flex items-center gap-3 mb-2">
        <BarChart2 size={20} className="text-blue-400" />
        <h1 className="text-xl font-bold text-white">Analytics</h1>
        <span className="text-sm text-slate-500">Historical performance overview</span>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Predictions',  value: summary.total_predictions  ?? '--', color: '#3b82f6' },
          { label: 'Average Health',     value: summary.average_health_score ? `${summary.average_health_score}%` : '--', color: '#10b981' },
          { label: 'Warning Events',     value: summary.warning_count  ?? '--', color: '#f59e0b' },
          { label: 'Critical Events',    value: summary.critical_count ?? '--', color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="glass-card p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{loading ? '…' : value}</p>
          </div>
        ))}
      </div>

      {/* Equipment Health Table */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <Activity size={14} className="text-green-400" />
          Equipment Health Snapshot
        </h2>
        {health.length === 0 ? (
          <p className="text-slate-600 text-sm text-center py-8">No data yet — start the simulation</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
                  <th className="text-left py-2 pr-4">Equipment</th>
                  <th className="text-left py-2 pr-4">Status</th>
                  <th className="text-left py-2 pr-4">Health Score</th>
                  <th className="text-left py-2">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {health.map(eq => {
                  const color = eq.risk_label === 'Critical' ? '#ef4444' : eq.risk_label === 'Warning' ? '#f59e0b' : '#10b981'
                  const barW  = eq.health_score || 0
                  return (
                    <tr key={eq.equipment_id} className="border-b" style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <td className="py-3 pr-4 font-medium text-white">{eq.equipment_name}</td>
                      <td className="py-3 pr-4">
                        <span className={`status-badge ${eq.risk_label === 'Critical' ? 'badge-critical' : eq.risk_label === 'Warning' ? 'badge-warning' : 'badge-healthy'}`}>
                          {eq.risk_label}
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full bg-slate-800">
                            <div className="h-full rounded-full" style={{ width: `${barW}%`, background: color, transition: 'width 0.5s ease' }} />
                          </div>
                          <span className="text-xs font-mono" style={{ color }}>{barW}%</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-500 text-xs">
                        {eq.last_updated ? new Date(eq.last_updated).toLocaleTimeString() : '--'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Failure Trend Chart */}
      <div className="glass-card p-5">
        <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingUp size={14} className="text-purple-400" />
          Failure Prediction Trend
        </h2>
        <FailureTrendChart predictions={predictions} />
      </div>
    </div>
  )
}
