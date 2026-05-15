import React, { useState, useMemo } from 'react'
import { useSensorData } from '../hooks/useSensorData'
import { useAlerts } from '../hooks/useAlerts'
import SensorCard from '../components/SensorCards/SensorCard'
import LiveChart from '../components/Charts/LiveChart'
import AlertPanel from '../components/Alerts/AlertPanel'
import EquipmentHealth from '../components/Equipment/EquipmentHealth'
import RecommendationPanel from '../components/Recommendations/RecommendationPanel'
import FailureTrendChart from '../components/Charts/FailureTrendChart'
import { fetchAnalytics, fetchUploadedDatasets } from '../services/api'
import { useUploadedData } from '../hooks/useUploadedData'


import {
  Thermometer, Activity, Zap, Gauge, Wind, Cpu,
  ChevronDown, Database, UploadCloud
} from 'lucide-react'


const SENSOR_CONFIG = [
  { key: 'temperature', label: 'Temperature', unit: '°C',    icon: Thermometer, color: '#ef4444' },
  { key: 'vibration',   label: 'Vibration',   unit: 'mm/s',  icon: Activity,    color: '#f97316' },
  { key: 'voltage',     label: 'Voltage',     unit: 'V',     icon: Zap,         color: '#3b82f6' },
  { key: 'current',     label: 'Current',     unit: 'A',     icon: Cpu,         color: '#10b981' },
  { key: 'pressure',    label: 'Pressure',    unit: 'PSI',   icon: Gauge,       color: '#06b6d4' },
  { key: 'rpm',         label: 'RPM',         unit: 'RPM',   icon: Wind,        color: '#8b5cf6' },
]

export default function Dashboard() {
  const liveData = useSensorData()
  const { alerts } = useAlerts()

  // DataSource toggle
  const [dataSource, setDataSource] = useState('live') // 'live' or dataset_id
  const uploadedData = useUploadedData(dataSource === 'live' ? null : dataSource)
  const [datasets, setDatasets] = useState([])

  const { equipmentList, sensorHistory } = dataSource === 'live' ? liveData : uploadedData

  // Selected equipment tab
  const [selectedEq, setSelectedEq] = useState(null)

  
  // Analytics summary for uploaded data
  const [analytics, setAnalytics] = useState(null)

  React.useEffect(() => {
    const loadDatasets = async () => {
      try {
        const res = await fetchUploadedDatasets()
        setDatasets(res.data.datasets || [])
      } catch (e) {}
    }
    loadDatasets()

    const loadAnalytics = async () => {
      try {
        const res = await fetchAnalytics()
        setAnalytics(res.data.summary)
      } catch (e) {}
    }
    loadAnalytics()
    const interval = setInterval(loadAnalytics, 10000)
    return () => clearInterval(interval)
  }, [])



  // Use first equipment by default
  const activeEq = useMemo(() => {
    if (equipmentList.length === 0) return null
    if (selectedEq) return equipmentList.find(e => e.sensor?.equipment_id === selectedEq) || equipmentList[0]
    return equipmentList[0]
  }, [equipmentList, selectedEq])

  const activeId     = activeEq?.sensor?.equipment_id
  const activeSensor = activeEq?.sensor || {}
  const activePred   = activeEq?.prediction || {}
  const activeHist   = sensorHistory[activeId] || {}
  const activeRecs   = equipmentList.flatMap(e => e.recommendations || [])

  // Collect all predictions for trend chart
  const allPredictions = equipmentList.flatMap(e =>
    e.prediction ? [e.prediction] : []
  )

  // Overall KPIs
  const criticalCount = equipmentList.filter(e => e.prediction?.risk_label === 'Critical').length
  const warningCount  = equipmentList.filter(e => e.prediction?.risk_label === 'Warning').length
  const avgHealth     = equipmentList.length
    ? Math.round(equipmentList.reduce((s, e) => s + (e.prediction?.health_score ?? 100), 0) / equipmentList.length)
    : 100

  return (
    <div className="p-6 flex flex-col gap-6 page-enter">

      {/* ── KPI Row & Data Source Selector ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Activity size={20} className="text-blue-400" /> Dashboard
        </h1>

        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Data Source:</span>
          <div className="relative min-w-[200px]">
            <select
              value={dataSource}
              onChange={e => {
                setDataSource(e.target.value === 'live' ? 'live' : Number(e.target.value))
                setSelectedEq(null)
              }}
              className="appearance-none w-full pl-3 pr-8 py-2 rounded-lg text-xs font-bold cursor-pointer transition-colors"
              style={{
                background: dataSource === 'live' ? 'rgba(16,185,129,0.1)' : 'rgba(139,92,246,0.1)',
                border: `1px solid ${dataSource === 'live' ? 'rgba(16,185,129,0.3)' : 'rgba(139,92,246,0.3)'}`,
                color: dataSource === 'live' ? '#10b981' : '#a78bfa',
              }}
            >
              <option value="live">🟢 Live Simulation Stream</option>
              {datasets.map(d => (
                <option key={d.id} value={d.id}>
                  📁 {d.original_name} ({d.row_count} rows)
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Equipment Monitored', value: equipmentList.length || 4, color: '#3b82f6', sub: 'Active units' },
          { label: 'Average Health',      value: `${avgHealth}%`,           color: '#10b981', sub: 'Fleet score' },
          { label: 'Warnings',            value: warningCount,              color: '#f59e0b', sub: 'Need attention' },
          { label: 'Critical Alerts',     value: criticalCount,             color: '#ef4444', sub: 'Immediate action' },
        ].map(({ label, value, color, sub }) => (
          <div key={label} className="glass-card p-4">
            <p className="text-xs text-slate-500 mb-1">{label}</p>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-[10px] text-slate-600 mt-0.5">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── Equipment Tabs ───────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 flex-wrap">
        {equipmentList.map(eq => {
          const id    = eq.sensor?.equipment_id
          const name  = eq.sensor?.equipment_name
          const label = eq.prediction?.risk_label || 'Healthy'
          const color = label === 'Critical' ? '#ef4444' : label === 'Warning' ? '#f59e0b' : '#10b981'
          const active = (selectedEq || equipmentList[0]?.sensor?.equipment_id) === id
          return (
            <button key={id} onClick={() => setSelectedEq(id)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: active ? `${color}18` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? color + '55' : 'rgba(255,255,255,0.08)'}`,
                color: active ? color : '#94a3b8',
              }}>
              <span className="w-2 h-2 rounded-full" style={{ background: color }} />
              {name}
            </button>
          )
        })}
      </div>

      {/* ── Main Grid ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left 2/3: Sensor cards + Charts */}
        <div className="lg:col-span-2 flex flex-col gap-6">

          {/* Sensor Cards 3x2 grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {SENSOR_CONFIG.map(({ key, label, unit, icon, color }) => {
              const val    = activeSensor[key]
              const hist   = activeHist[key] || []
              const risk   = activePred?.risk_label || 'Healthy'
              // Per-sensor status
              const status = (() => {
                if (key === 'temperature') {
                  if (val >= 90) return 'Critical'
                  if (val >= 75) return 'Warning'
                }
                if (key === 'vibration') {
                  if (val >= 4.5) return 'Critical'
                  if (val >= 3.0) return 'Warning'
                }
                if (key === 'pressure') {
                  if (val >= 145) return 'Critical'
                  if (val >= 130) return 'Warning'
                }
                return 'Healthy'
              })()
              return (
                <SensorCard key={key}
                  label={label} value={val} unit={unit}
                  icon={icon} color={color}
                  status={status} history={hist}
                />
              )
            })}
          </div>

          {/* Live Charts */}
          <div className="glass-card p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-white">Live Sensor Trends</h3>
              <span className="text-[10px] text-slate-500">{activeEq?.sensor?.equipment_name || 'Select equipment'}</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <LiveChart title="Temperature" data={activeHist.temperature} color="#ef4444" unit="°C" />
              <LiveChart title="Vibration"   data={activeHist.vibration}   color="#f97316" unit="mm/s" />
              <LiveChart title="Voltage"     data={activeHist.voltage}     color="#3b82f6" unit="V" />
              <LiveChart title="Pressure"    data={activeHist.pressure}    color="#06b6d4" unit="PSI" />
            </div>
          </div>

          {/* Failure Trend */}
          <div className="glass-card p-5">
            <h3 className="text-sm font-semibold text-white mb-4">Prediction History</h3>
            <FailureTrendChart predictions={allPredictions} />
          </div>
        </div>

        {/* Right 1/3: Alerts + Health + Recommendations */}
        <div className="flex flex-col gap-4">
          
          {/* Uploaded Data Summary */}
          {analytics && analytics.uploaded_total > 0 && (
            <div className="glass-card p-5 border-purple-500/20" style={{ background: 'linear-gradient(145deg, rgba(139,92,246,0.05) 0%, rgba(13,21,38,0.5) 100%)' }}>
              <div className="flex items-center gap-2 mb-3">
                <UploadCloud size={16} className="text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Uploaded Data ML Results</h3>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                  <p className="text-[10px] text-slate-400">Total Rows</p>
                  <p className="text-lg font-bold text-white">{analytics.uploaded_total}</p>
                </div>
                <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/20">
                  <p className="text-[10px] text-green-400/70">Healthy</p>
                  <p className="text-lg font-bold text-green-400">{analytics.uploaded_healthy}</p>
                </div>
                <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-[10px] text-amber-400/70">Warnings</p>
                  <p className="text-lg font-bold text-amber-400">{analytics.uploaded_warning}</p>
                </div>
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
                  <p className="text-[10px] text-red-400/70">Critical</p>
                  <p className="text-lg font-bold text-red-400">{analytics.uploaded_critical}</p>
                </div>
              </div>
              <a href="/upload" className="text-[11px] text-purple-400 hover:text-purple-300 transition-colors flex items-center justify-between w-full bg-purple-500/10 p-2 rounded">
                View Full Analysis <span>→</span>
              </a>
            </div>
          )}

          <EquipmentHealth equipmentList={equipmentList} />
          <AlertPanel alerts={alerts} />
          <RecommendationPanel recommendations={activeRecs} />
        </div>
      </div>
    </div>
  )
}

