import React, { useEffect, useState } from 'react'
import { fetchSensorHistory, fetchAlerts, fetchRecommendations } from '../services/api'
import { FileText, Download } from 'lucide-react'

export default function Reports() {
  const [sensorLog, setSensorLog] = useState([])
  const [alertLog, setAlertLog]   = useState([])
  const [recLog, setRecLog]       = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('sensors')

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a, r] = await Promise.all([
          fetchSensorHistory(null, 100),
          fetchAlerts(100),
          fetchRecommendations(100)
        ])
        setSensorLog(s.data.data || [])
        setAlertLog(a.data.data || [])
        setRecLog(r.data.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const downloadCSV = () => {
    let data = []
    if (tab === 'sensors') data = sensorLog
    else if (tab === 'alerts') data = alertLog
    else data = recLog

    if (!data.length) return

    const keys = Object.keys(data[0])
    const csv  = [
      keys.join(','),
      ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${tab}_report.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sensorCols = ['equipment_name', 'equipment_type', 'temperature', 'vibration', 'voltage', 'current', 'pressure', 'rpm', 'timestamp']
  const alertCols  = ['equipment_name', 'severity', 'sensor', 'value', 'message', 'timestamp']
  const recCols    = ['equipment_name', 'priority', 'title', 'description', 'timestamp']

  const renderCell = (col, val) => {
    if ((col === 'severity' || col === 'priority') && val) {
      const c = (val === 'Critical' || val === 'CRITICAL') ? '#ef4444' : '#f59e0b'
      return <span style={{ color: c, fontWeight: 600 }}>{val}</span>
    }
    if (typeof val === 'number') return <span className="font-mono">{Number(val).toFixed(2)}</span>
    return <span className="max-w-[300px] inline-block truncate" title={val}>{val}</span>
  }

  const renderTable = (rows, cols) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-500 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {cols.map(c => (
              <th key={c} className="text-left py-2 pr-4 font-medium capitalize whitespace-nowrap">
                {c.replace(/_/g, ' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-b hover:bg-white/[0.02] transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
              {cols.map(c => (
                <td key={c} className="py-2 pr-4 text-slate-300">
                  {renderCell(c, row[c])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="p-6 flex flex-col gap-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-blue-400" />
          <h1 className="text-xl font-bold text-white">Maintenance Intelligence Audit</h1>
        </div>
        <button onClick={downloadCSV}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', border: 'none', boxShadow: '0 4px 15px rgba(59,130,246,0.3)' }}>
          <Download size={14} /> Export Enterprise Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[
          { k: 'sensors', l: 'Telemetry Logs' },
          { k: 'alerts',  l: 'AI Analytics Alerts' },
          { k: 'recs',    l: 'Prescriptive Actions' }
        ].map(item => (
          <button key={item.k} onClick={() => setTab(item.k)}
            className="px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
            style={{
              background: tab === item.k ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)',
              border: `1px solid ${tab === item.k ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)'}`,
              color: tab === item.k ? '#60a5fa' : '#64748b',
              boxShadow: tab === item.k ? '0 0 15px rgba(59,130,246,0.1)' : 'none'
            }}>
            {item.l}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card p-5">
        {loading ? (
          <p className="text-slate-600 text-sm text-center py-12">Retrieving Industrial Logs…</p>
        ) : (
          tab === 'sensors' ? renderTable(sensorLog, sensorCols) :
          tab === 'alerts'  ? renderTable(alertLog, alertCols) :
          renderTable(recLog, recCols)
        )}
        {!loading && (
          (tab === 'sensors' && sensorLog.length === 0) ||
          (tab === 'alerts' && alertLog.length === 0) ||
          (tab === 'recs' && recLog.length === 0)
        ) && (
          <p className="text-slate-600 text-sm text-center py-12">No data found in current selection</p>
        )}
      </div>
    </div>
  )
}

