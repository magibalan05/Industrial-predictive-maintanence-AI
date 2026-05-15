import React, { useState, useEffect } from 'react'
import UploadPanel from '../components/Upload/UploadPanel'
import { fetchUploadedDatasets, fetchUploadedReadings } from '../services/api'
import FailureTrendChart from '../components/Charts/FailureTrendChart'
import { Upload, Database, TrendingUp, AlertTriangle } from 'lucide-react'

export default function UploadPage() {
  const [latestDataset, setLatestDataset] = useState(null)
  const [readings, setReadings]           = useState([])
  const [uploadsCount, setUploadsCount]   = useState(0)

  useEffect(() => {
    fetchUploadedDatasets().then(res => {
      const dsList = res.data.datasets || []
      setUploadsCount(dsList.length)
      if (dsList.length > 0) {
        setLatestDataset(dsList[0])
        fetchUploadedReadings(dsList[0].id, 200).then(r => {
          setReadings(r.data.rows || [])
        })
      }
    }).catch(() => {})
  }, [])

  const handleUploadComplete = (result) => {
    setUploadsCount(c => c + 1)
    setLatestDataset({
      id:             result.dataset_id,
      original_name:  result.filename,
      row_count:      result.row_count,
      healthy_count:  result.healthy_count,
      warning_count:  result.warning_count,
      critical_count: result.critical_count,
      uploaded_at:    result.uploaded_at,
    })
    setReadings(result.rows || [])
  }

  // Build fake "predictions" list from uploaded readings for trend chart
  const uploadedPredictions = readings.map(r => ({
    risk_label:   r.risk_label,
    risk_level:   r.risk_level,
    timestamp:    r.timestamp,
    equipment_id: r.equipment_id,
  }))

  return (
    <div className="p-6 flex flex-col gap-6 page-enter">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Upload size={20} className="text-blue-400" />
        <h1 className="text-xl font-bold text-white">Data Upload</h1>
        <span className="text-sm text-slate-500">Upload CSV/Excel sensor data for ML analysis</span>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Datasets Uploaded', value: uploadsCount,                           color: '#3b82f6', icon: Database },
          { label: 'Latest Rows',       value: latestDataset?.row_count ?? '--',        color: '#8b5cf6', icon: TrendingUp },
          { label: 'Warnings Found',    value: latestDataset?.warning_count ?? '--',    color: '#f59e0b', icon: AlertTriangle },
          { label: 'Criticals Found',   value: latestDataset?.critical_count ?? '--',   color: '#ef4444', icon: AlertTriangle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="glass-card p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
              <Icon size={16} style={{ color }} />
            </div>
            <div>
              <p className="text-xs text-slate-500">{label}</p>
              <p className="text-xl font-bold" style={{ color }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Panel */}
        <div>
          <UploadPanel onUploadComplete={handleUploadComplete} />
        </div>

        {/* Latest Dataset Analysis */}
        <div className="flex flex-col gap-4">
          {latestDataset && (
            <>
              <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp size={14} className="text-purple-400" />
                  Uploaded Data — Prediction Trend
                </h3>
                <FailureTrendChart predictions={uploadedPredictions} />
              </div>

              {/* Top anomalies from uploaded data */}
              <div className="glass-card p-5 flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <AlertTriangle size={14} className="text-amber-400" />
                  Critical & Warning Rows
                </h3>
                <div className="overflow-y-auto max-h-56">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr className="text-slate-500 border-b border-white/5">
                        {['Equipment', 'Temp', 'Vib', 'Status', 'Health'].map(h => (
                          <th key={h} className="text-left py-1.5 pr-3 font-medium">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {readings
                        .filter(r => r.risk_level > 0)
                        .slice(0, 30)
                        .map((r, i) => (
                          <tr key={i} className="border-b border-white/[0.03]">
                            <td className="py-1.5 pr-3 text-slate-300">{r.equipment_name || '--'}</td>
                            <td className="py-1.5 pr-3 font-mono text-red-400">{r.temperature?.toFixed(1)}°</td>
                            <td className="py-1.5 pr-3 font-mono text-orange-400">{r.vibration?.toFixed(2)}</td>
                            <td className="py-1.5 pr-3">
                              <span className={`status-badge ${r.risk_label === 'Critical' ? 'badge-critical' : 'badge-warning'}`}
                                style={{ fontSize: '8px', padding: '1px 5px' }}>
                                {r.risk_label}
                              </span>
                            </td>
                            <td className="py-1.5 font-mono"
                              style={{ color: r.risk_label === 'Critical' ? '#ef4444' : '#f59e0b' }}>
                              {r.health_score}%
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {readings.filter(r => r.risk_level > 0).length === 0 && (
                    <p className="text-slate-600 text-xs text-center py-6">No anomalies in latest dataset</p>
                  )}
                </div>
              </div>
            </>
          )}

          {!latestDataset && (
            <div className="glass-card p-10 flex flex-col items-center justify-center text-center gap-3">
              <Upload size={32} className="text-slate-700" />
              <p className="text-slate-500 text-sm">Upload a file to see ML analysis results here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
