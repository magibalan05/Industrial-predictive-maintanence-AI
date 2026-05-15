import React, { useState, useMemo } from 'react'
import { useSensorData } from '../hooks/useSensorData'
import { useAlerts } from '../hooks/useAlerts'
import SensorCard from '../components/SensorCards/SensorCard'
import LiveChart from '../components/Charts/LiveChart'
import AlertPanel from '../components/Alerts/AlertPanel'
import EquipmentHealth from '../components/Equipment/EquipmentHealth'
import RecommendationPanel from '../components/Recommendations/RecommendationPanel'
import FailureTrendChart from '../components/Charts/FailureTrendChart'
import { fetchAnalytics } from '../services/api'

import {
  Thermometer, Activity, Zap, Gauge, Wind, Cpu,
  ChevronDown, Info, Clock, RefreshCw
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
  const { equipmentList, sensorHistory, wsStatus } = useSensorData()
  const { alerts } = useAlerts()

  // Selected equipment tab
  const [selectedEq, setSelectedEq] = useState(null)

  // Use first equipment by default
  const activeEq = useMemo(() => {
    if (equipmentList.length === 0) return null
    if (selectedEq) return equipmentList.find(e => e.sensor?.equipment_id === selectedEq) || equipmentList[0]
    return equipmentList[0]
  }, [equipmentList, selectedEq])

  if (equipmentList.length === 0 && wsStatus !== 'connected') {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 animate-pulse">
          <Activity size={32} className="text-blue-400" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">Initializing Digital Twin Network</h2>
        <p className="text-sm text-slate-500 max-w-sm">
          Establishing encrypted WebSocket connection to the Adaptive Industrial Intelligence engine...
        </p>
        <div className="mt-8 flex items-center gap-3 px-4 py-2 rounded-full bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 tracking-widest uppercase">
          <RefreshCw size={12} className="animate-spin text-blue-500" />
          Status: {wsStatus}
        </div>
      </div>
    )
  }

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

      {/* ── KPI Row ─────────────────────────────────────────────────────── */}
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
          
          {/* Explainable AI Reasoning Layer */}
          <div className="glass-card p-5 border-blue-500/20" style={{ background: 'linear-gradient(145deg, rgba(59,130,246,0.05) 0%, rgba(13,21,38,0.5) 100%)' }}>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 mb-4">
              <div className="flex items-center gap-1.5 mb-1">
                <Clock size={10} className="text-blue-400" />
                <span className="text-[10px] text-slate-500 uppercase">Est. RUL</span>
              </div>
              <p className="text-sm font-bold text-white">
                {activePred?.estimated_rul_hours || '---'} <span className="text-[10px] font-normal text-slate-500">Hrs</span>
              </p>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <Cpu size={16} className="text-blue-400" />

              <h3 className="text-sm font-semibold text-white">Explainable AI Insights</h3>
            </div>
            {activePred?.reasoning ? (
              <div className="flex gap-3">
                <div className="mt-1"><Info size={14} className="text-slate-500" /></div>
                <p className="text-xs text-slate-400 leading-relaxed italic">
                  "{activePred.reasoning}"
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-600 italic">Initiating AI reasoning sequence...</p>
            )}
          </div>

          <EquipmentHealth equipmentList={equipmentList} />
          <AlertPanel alerts={alerts} />
          <RecommendationPanel recommendations={activeRecs} />
        </div>

      </div>
    </div>
  )
}

