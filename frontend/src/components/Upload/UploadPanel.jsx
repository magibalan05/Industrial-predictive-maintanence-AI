import React, { useState, useRef, useCallback, useEffect } from 'react'
import {
  Upload, FileText, Trash2, Eye, CheckCircle,
  AlertTriangle, AlertOctagon, BarChart2, X, ChevronDown, ChevronUp
} from 'lucide-react'
import {
  uploadDataset, fetchUploadedDatasets,
  fetchUploadedReadings, deleteUploadedDataset
} from '../../services/api'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'

// ── Helpers ───────────────────────────────────────────────────────────────────
const RISK_COLORS = { Healthy: '#10b981', Warning: '#f59e0b', Critical: '#ef4444' }
const BADGE = {
  Healthy:  'badge-healthy',
  Warning:  'badge-warning',
  Critical: 'badge-critical',
}

function RiskBar({ healthy, warning, critical }) {
  const total = healthy + warning + critical || 1
  const data  = [
    { name: 'Healthy',  value: healthy,  fill: '#10b981' },
    { name: 'Warning',  value: warning,  fill: '#f59e0b' },
    { name: 'Critical', value: critical, fill: '#ef4444' },
  ]
  return (
    <ResponsiveContainer width="100%" height={80}>
      <BarChart data={data} barSize={28} margin={{ top: 4, right: 0, bottom: 0, left: -25 }}>
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={{ background: 'rgba(13,21,38,0.95)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 8, fontSize: 11 }}
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        <Bar dataKey="value" radius={[4,4,0,0]}>
          {data.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

function DatasetCard({ dataset, onDelete, onView }) {
  const [expanded, setExpanded] = useState(false)
  const [readings, setReadings] = useState([])
  const [loadingRows, setLoadingRows] = useState(false)

  const handleView = async () => {
    if (!expanded) {
      setLoadingRows(true)
      try {
        const res = await fetchUploadedReadings(dataset.id, 200)
        setReadings(res.data.rows || [])
      } catch (e) { console.error(e) }
      finally { setLoadingRows(false) }
    }
    setExpanded(v => !v)
  }

  return (
    <div className="glass-card p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
            <FileText size={16} className="text-blue-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{dataset.original_name}</p>
            <p className="text-[10px] text-slate-500">
              {dataset.row_count} rows · Uploaded {new Date(dataset.uploaded_at).toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleView}
            className="p-1.5 rounded-lg transition-colors hover:bg-blue-500/10"
            title={expanded ? 'Collapse' : 'View rows'}>
            {expanded ? <ChevronUp size={14} className="text-blue-400" /> : <Eye size={14} className="text-blue-400" />}
          </button>
          <button onClick={() => onDelete(dataset.id)}
            className="p-1.5 rounded-lg transition-colors hover:bg-red-500/10"
            title="Delete dataset">
            <Trash2 size={14} className="text-red-400" />
          </button>
        </div>
      </div>

      {/* Risk Summary */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Healthy',  value: dataset.healthy_count,  color: '#10b981' },
          { label: 'Warning',  value: dataset.warning_count,  color: '#f59e0b' },
          { label: 'Critical', value: dataset.critical_count, color: '#ef4444' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-lg p-2 text-center"
            style={{ background: `${color}10`, border: `1px solid ${color}30` }}>
            <p className="text-base font-bold" style={{ color }}>{value}</p>
            <p className="text-[9px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Mini Chart */}
      <RiskBar
        healthy={dataset.healthy_count}
        warning={dataset.warning_count}
        critical={dataset.critical_count}
      />

      {/* Expanded Rows Table */}
      {expanded && (
        <div className="mt-2 border-t border-white/5 pt-3">
          {loadingRows ? (
            <p className="text-slate-600 text-xs text-center py-4">Loading rows…</p>
          ) : (
            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-[10px]">
                <thead>
                  <tr className="text-slate-500 border-b border-white/5">
                    {['Equipment', 'Temp°C', 'Vib', 'Volt', 'Curr', 'Press', 'RPM', 'Status', 'Health'].map(h => (
                      <th key={h} className="text-left py-1.5 pr-3 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {readings.map((r, i) => (
                    <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                      <td className="py-1.5 pr-3 text-slate-300">{r.equipment_name || '--'}</td>
                      <td className="py-1.5 pr-3 font-mono text-red-400">{r.temperature?.toFixed(1)}</td>
                      <td className="py-1.5 pr-3 font-mono text-orange-400">{r.vibration?.toFixed(2)}</td>
                      <td className="py-1.5 pr-3 font-mono text-blue-400">{r.voltage?.toFixed(1)}</td>
                      <td className="py-1.5 pr-3 font-mono text-green-400">{r.current?.toFixed(1)}</td>
                      <td className="py-1.5 pr-3 font-mono text-cyan-400">{r.pressure?.toFixed(1)}</td>
                      <td className="py-1.5 pr-3 font-mono text-purple-400">{r.rpm?.toFixed(0)}</td>
                      <td className="py-1.5 pr-3">
                        <span className={`status-badge ${BADGE[r.risk_label] || 'badge-healthy'}`}
                          style={{ fontSize: '8px', padding: '1px 5px' }}>
                          {r.risk_label}
                        </span>
                      </td>
                      <td className="py-1.5 pr-3 font-mono" style={{ color: RISK_COLORS[r.risk_label] || '#10b981' }}>
                        {r.health_score}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Drop Zone ─────────────────────────────────────────────────────────────────
export default function UploadPanel({ onUploadComplete }) {
  const [dragging, setDragging]     = useState(false)
  const [uploading, setUploading]   = useState(false)
  const [progress, setProgress]     = useState(0)
  const [result, setResult]         = useState(null)
  const [error, setError]           = useState(null)
  const [datasets, setDatasets]     = useState([])
  const [loadingList, setLoadingList] = useState(true)
  const fileRef = useRef(null)

  const loadDatasets = useCallback(async () => {
    try {
      const res = await fetchUploadedDatasets()
      setDatasets(res.data.datasets || [])
    } catch (e) { console.error(e) }
    finally { setLoadingList(false) }
  }, [])

  useEffect(() => { loadDatasets() }, [loadDatasets])

  const handleFile = async (file) => {
    if (!file) return
    const ext = file.name.split('.').pop().toLowerCase()
    if (!['csv', 'xlsx', 'xls'].includes(ext)) {
      setError('Only CSV and Excel files are accepted.')
      return
    }
    setUploading(true)
    setProgress(0)
    setResult(null)
    setError(null)
    try {
      const res = await uploadDataset(file, setProgress)
      setResult(res.data.data)
      await loadDatasets()
      onUploadComplete?.(res.data.data)
    } catch (e) {
      setError(e.response?.data?.detail || 'Upload failed. Check file format.')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  const onDrop = (e) => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleDelete = async (id) => {
    await deleteUploadedDataset(id)
    setDatasets(d => d.filter(ds => ds.id !== id))
  }

  return (
    <div className="flex flex-col gap-6">

      {/* ── Drop Zone ──────────────────────────────────────────────────────── */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-3 p-10 rounded-2xl cursor-pointer transition-all"
        style={{
          border: `2px dashed ${dragging ? '#3b82f6' : 'rgba(59,130,246,0.25)'}`,
          background: dragging ? 'rgba(59,130,246,0.06)' : 'rgba(13,21,38,0.5)',
          boxShadow: dragging ? '0 0 24px rgba(59,130,246,0.2)' : 'none',
        }}
      >
        <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls"
          className="hidden" onChange={e => handleFile(e.target.files[0])} />

        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.25)' }}>
          <Upload size={24} className="text-blue-400" />
        </div>

        {uploading ? (
          <div className="flex flex-col items-center gap-2 w-full max-w-xs">
            <p className="text-sm text-blue-400 font-medium">Processing with ML…</p>
            <div className="w-full h-2 rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${progress || 50}%` }} />
            </div>
            <p className="text-xs text-slate-500">{progress}%</p>
          </div>
        ) : (
          <>
            <div className="text-center">
              <p className="text-sm font-semibold text-white">Drop your sensor data file here</p>
              <p className="text-xs text-slate-500 mt-1">or click to browse · CSV, XLSX, XLS · Max 10 MB</p>
            </div>
            <div className="flex gap-2 mt-1">
              {['CSV', 'XLSX', 'XLS'].map(f => (
                <span key={f} className="px-2 py-0.5 rounded text-[10px] font-medium"
                  style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>
                  .{f}
                </span>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── CSV Template hint ──────────────────────────────────────────────── */}
      <div className="rounded-xl p-3 text-[11px] text-slate-500 leading-relaxed"
        style={{ background: 'rgba(59,130,246,0.04)', border: '1px solid rgba(59,130,246,0.12)' }}>
        <p className="text-blue-400 font-semibold mb-1">Expected CSV columns:</p>
        <code className="font-mono text-slate-400">
          equipment_id, equipment_name, equipment_type, temperature, vibration, voltage, current, pressure, rpm, timestamp
        </code>
        <p className="mt-1">All sensor columns are optional — missing ones default to 0. Equipment columns are auto-filled if absent.</p>
      </div>

      {/* ── Error / Success ────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-xl text-sm"
          style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)' }}>
          <AlertOctagon size={15} className="text-red-400 mt-0.5 shrink-0" />
          <span className="text-red-300">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto"><X size={13} className="text-red-400" /></button>
        </div>
      )}

      {result && (
        <div className="flex flex-col gap-3 p-4 rounded-xl animate-fade-in"
          style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <div className="flex items-center gap-2">
            <CheckCircle size={15} className="text-green-400" />
            <span className="text-sm font-semibold text-green-400">
              Upload complete — {result.row_count} rows processed!
            </span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Healthy',  value: result.healthy_count,  color: '#10b981' },
              { label: 'Warning',  value: result.warning_count,  color: '#f59e0b' },
              { label: 'Critical', value: result.critical_count, color: '#ef4444' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg p-2 text-center"
                style={{ background: `${color}10` }}>
                <p className="text-lg font-bold" style={{ color }}>{value}</p>
                <p className="text-[10px] text-slate-500">{label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Past Datasets ──────────────────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <BarChart2 size={14} className="text-purple-400" />
            Uploaded Datasets
          </h3>
          <span className="text-[10px] text-slate-500">{datasets.length} total</span>
        </div>

        {loadingList ? (
          <p className="text-slate-600 text-xs text-center py-6">Loading…</p>
        ) : datasets.length === 0 ? (
          <div className="text-center py-8 text-slate-600 text-sm"
            style={{ border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12 }}>
            No datasets uploaded yet
          </div>
        ) : (
          datasets.map(ds => (
            <DatasetCard key={ds.id} dataset={ds} onDelete={handleDelete} />
          ))
        )}
      </div>
    </div>
  )
}
