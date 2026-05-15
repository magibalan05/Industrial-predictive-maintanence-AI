import React, { useEffect, useState } from 'react'
import { fetchSensorHistory, fetchAlerts, fetchUploadedDatasets, fetchUploadedReadings } from '../services/api'
import { FileText, Download, Upload, Database, ChevronDown } from 'lucide-react'

export default function Reports() {
  const [sensorLog, setSensorLog]       = useState([])
  const [alertLog, setAlertLog]         = useState([])
  const [datasets, setDatasets]         = useState([])
  const [selectedDs, setSelectedDs]     = useState(null)
  const [uploadedRows, setUploadedRows] = useState([])
  const [tab, setTab]                   = useState('sensors')
  const [loading, setLoading]           = useState(true)
  const [loadingRows, setLoadingRows]   = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const [s, a, d] = await Promise.all([
          fetchSensorHistory(null, 100),
          fetchAlerts(100),
          fetchUploadedDatasets(),
        ])
        setSensorLog(s.data.data || [])
        setAlertLog(a.data.data || [])
        const dsList = d.data.datasets || []
        setDatasets(dsList)
        if (dsList.length > 0) setSelectedDs(dsList[0].id)
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  useEffect(() => {
    if (!selectedDs) return
    setLoadingRows(true)
    fetchUploadedReadings(selectedDs, 200)
      .then(r => setUploadedRows(r.data.rows || []))
      .catch(() => {})
      .finally(() => setLoadingRows(false))
  }, [selectedDs])

  const downloadCSV = () => {
    let data = []
    if (tab === 'sensors')  data = sensorLog
    if (tab === 'alerts')   data = alertLog
    if (tab === 'uploaded') data = uploadedRows
    if (!data.length) return
    const keys = Object.keys(data[0])
    const csv  = [keys.join(','), ...data.map(r => keys.map(k => `"${r[k] ?? ''}"`).join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a'); a.href = url; a.download = `${tab}_report.csv`; a.click()
    URL.revokeObjectURL(url)
  }

  const TABS = [
    { key: 'sensors',  label: 'Simulated Sensor Log', icon: Database },
    { key: 'alerts',   label: 'Alert Log',            icon: FileText },
    { key: 'uploaded', label: 'Uploaded Data',        icon: Upload },
  ]

  const sensorCols   = ['equipment_name','equipment_type','temperature','vibration','voltage','current','pressure','rpm','data_source','timestamp']
  const alertCols    = ['equipment_name','severity','sensor','value','message','data_source','timestamp']
  const uploadedCols = ['equipment_name','equipment_type','temperature','vibration','voltage','current','pressure','rpm','risk_label','health_score','confidence','timestamp']

  const SOURCE_BADGE = {
    simulated: { bg: 'rgba(59,130,246,0.12)',  color: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
    uploaded:  { bg: 'rgba(139,92,246,0.12)',  color: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
  }

  const renderCell = (col, val) => {
    if (col === 'data_source' && val) {
      const s = SOURCE_BADGE[val] || SOURCE_BADGE.simulated
      return <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold"
        style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}>{val}</span>
    }
    if (col === 'risk_label' && val) {
      const c = val==='Critical'?'#ef4444':val==='Warning'?'#f59e0b':'#10b981'
      return <span style={{ color: c, fontWeight: 600 }}>{val}</span>
    }
    if (col === 'severity' && val) {
      const c = val==='Critical'?'#ef4444':'#f59e0b'
      return <span style={{ color: c, fontWeight: 600 }}>{val}</span>
    }
    if (col === 'health_score' && val != null) return <span className="font-mono">{val}%</span>
    if (col === 'confidence'   && val != null) return <span className="font-mono">{Number(val).toFixed(1)}%</span>
    if (typeof val === 'number') return <span className="font-mono">{Number(val).toFixed(2)}</span>
    return <span>{val ?? '--'}</span>
  }

  const renderTable = (rows, cols) => (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-slate-500 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {cols.map(c => (
              <th key={c} className="text-left py-2 pr-4 font-medium capitalize whitespace-nowrap">
                {c.replace(/_/g,' ')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 200).map((row, i) => (
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium"
          style={{ background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.3)', color:'#60a5fa' }}>
          <Download size={13} /> Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: tab===key ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${tab===key ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.08)'}`,
              color: tab===key ? '#60a5fa' : '#94a3b8',
            }}>
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      {/* Dataset selector for uploaded tab */}
      {tab === 'uploaded' && datasets.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-slate-500">Dataset:</span>
          <div className="relative">
            <select value={selectedDs||''} onChange={e => setSelectedDs(Number(e.target.value))}
              className="appearance-none pl-3 pr-8 py-2 rounded-lg text-xs font-medium cursor-pointer"
              style={{ background:'rgba(13,21,38,0.8)', border:'1px solid rgba(59,130,246,0.25)', color:'#e2e8f0' }}>
              {datasets.map(d => (
                <option key={d.id} value={d.id}>
                  {d.original_name} ({d.row_count} rows · {new Date(d.uploaded_at).toLocaleDateString()})
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>
          <div className="flex gap-3 text-[10px]">
            {datasets.find(d=>d.id===selectedDs) && (() => {
              const ds = datasets.find(d=>d.id===selectedDs)
              return <>
                <span className="text-green-400">✓ {ds.healthy_count} Healthy</span>
                <span className="text-amber-400">⚠ {ds.warning_count} Warning</span>
                <span className="text-red-400">✕ {ds.critical_count} Critical</span>
              </>
            })()}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="glass-card p-5">
        {loading || loadingRows ? (
          <p className="text-slate-600 text-sm text-center py-12">Loading…</p>
        ) : tab === 'sensors' ? (
          sensorLog.length === 0
            ? <p className="text-slate-600 text-sm text-center py-12">No sensor data yet</p>
            : renderTable(sensorLog, sensorCols)
        ) : tab === 'alerts' ? (
          alertLog.length === 0
            ? <p className="text-slate-600 text-sm text-center py-12">No alerts recorded yet</p>
            : renderTable(alertLog, alertCols)
        ) : (
          datasets.length === 0
            ? <div className="flex flex-col items-center py-12 gap-3">
                <Upload size={32} className="text-slate-700" />
                <p className="text-slate-600 text-sm">No datasets uploaded yet</p>
              </div>
            : uploadedRows.length === 0
              ? <p className="text-slate-600 text-sm text-center py-12">No rows found</p>
              : renderTable(uploadedRows, uploadedCols)
        )}
      </div>
    </div>
  )
}
