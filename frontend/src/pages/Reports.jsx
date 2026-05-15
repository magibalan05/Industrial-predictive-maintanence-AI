import React, { useEffect, useState } from 'react'
import { fetchSensorHistory, fetchAlerts } from '../services/api'
import { FileText, Download } from 'lucide-react'

export default function Reports() {
  const [sensorLog, setSensorLog] = useState([])
  const [alertLog, setAlertLog]   = useState([])
  const [loading, setLoading]     = useState(true)
  const [tab, setTab]             = useState('sensors')

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a] = await Promise.all([
          fetchSensorHistory(null, 100),
          fetchAlerts(100)
        ])
        setSensorLog(s.data.data || [])
        setAlertLog(a.data.data || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const downloadCSV = () => {
    const data = tab === 'sensors' ? sensorLog : alertLog
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

  const renderCell = (col, val) => {
    if (col === 'severity' && val) {
      const c = val === 'Critical' ? '#ef4444' : '#f59e0b'
      return <span style={{ color: c, fontWeight: 600 }}>{val}</span>
    }
    if (typeof val === 'number') return <span className="font-mono">{Number(val).toFixed(2)}</span>
    return <span>{val}</span>
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
                <td key={c} className="py-2 pr-4 text-slate-300 whitespace-nowrap">
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
          <h1 className="text-xl font-bold text-white">Reports</h1>
        </div>
        <button onClick={downloadCSV}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all"
          style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa' }}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {['sensors', 'alerts'].map(k => (
          <button key={k} onClick={() => setTab(k)}
            className="px-4 py-2 rounded-lg text-xs font-medium transition-all capitalize"
            style={{
              background: tab === k ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${tab === k ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: tab === k ? '#60a5fa' : '#94a3b8',
            }}>
            {k === 'sensors' ? 'Sensor Log' : 'Alert Log'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="glass-card p-5">
        {loading ? (
          <p className="text-slate-600 text-sm text-center py-12">Loading logs…</p>
        ) : tab === 'sensors' ? (
          sensorLog.length === 0
            ? <p className="text-slate-600 text-sm text-center py-12">No sensor data yet — start the simulation</p>
            : renderTable(sensorLog, sensorCols)
        ) : (
          alertLog.length === 0
            ? <p className="text-slate-600 text-sm text-center py-12">No alerts recorded yet</p>
            : renderTable(alertLog, alertCols)
        )}
      </div>
    </div>
  )
}
