import React, { useState } from 'react'
import { Settings as SettingsIcon, Save, Info } from 'lucide-react'

const EQUIPMENT_OPTIONS = [
  { id: 'EQ-001', name: 'Motor A',       type: 'Motor' },
  { id: 'EQ-002', name: 'Transformer B', type: 'Transformer' },
  { id: 'EQ-003', name: 'Generator C',   type: 'Generator' },
  { id: 'EQ-004', name: 'Turbine D',     type: 'Turbine' },
]

function Slider({ label, value, min, max, step = 1, unit, onChange }) {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white/5 border border-white/5">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{label}</span>
        <span className="text-xs font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full h-1 bg-slate-800 rounded-full appearance-none cursor-pointer accent-blue-500"
      />
    </div>
  )
}

export default function Settings() {
  const [interval, setInterval]   = useState(2)
  const [anomalyRate, setAnomalyRate] = useState(15)
  const [saved, setSaved]         = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-6 flex flex-col gap-6 page-enter max-w-2xl">
      <div className="flex items-center gap-3">
        <SettingsIcon size={20} className="text-blue-400" />
        <h1 className="text-xl font-bold text-white">Settings</h1>
      </div>

      {/* Simulation Config */}
      <div className="glass-card p-6 flex flex-col gap-6">
        <h2 className="text-sm font-semibold text-white">Simulation Configuration</h2>

        <Slider label="Data Generation Interval" value={interval} min={1} max={10} unit="s"
          onChange={setInterval} />
        <Slider label="Anomaly Injection Rate" value={anomalyRate} min={0} max={50} unit="%"
          onChange={setAnomalyRate} />
      </div>

      {/* Equipment Config */}
      <div className="glass-card p-6 flex flex-col gap-4">
        <h2 className="text-sm font-semibold text-white">Monitored Equipment</h2>
        <div className="grid grid-cols-2 gap-3">
          {EQUIPMENT_OPTIONS.map(eq => (
            <div key={eq.id} className="flex items-center gap-3 p-3 rounded-xl"
              style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
              <div className="w-2 h-2 rounded-full bg-green-400" />
              <div>
                <p className="text-xs font-medium text-white">{eq.name}</p>
                <p className="text-[10px] text-slate-500">{eq.type} · {eq.id}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Info Panel */}
      <div className="flex items-start gap-3 p-4 rounded-xl"
        style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <Info size={15} className="text-blue-400 mt-0.5 shrink-0" />
        <div className="text-[11px] text-slate-400 leading-relaxed">
          <p className="font-semibold text-blue-400 mb-1">About the ML Model</p>
          <p>Random Forest Classifier trained on 12,000 synthetic industrial sensor samples. Features: Temperature, Vibration, Voltage, Current, Pressure, RPM. Labels: Healthy / Warning / Critical. Accuracy ≈ 95%.</p>
        </div>
      </div>

      {/* Save Button */}
      <button onClick={handleSave}
        className="self-start flex items-center gap-2 px-6 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all hover:scale-105"
        style={{ 
          background: saved ? 'linear-gradient(135deg, #10b981, #059669)' : 'linear-gradient(135deg, #3b82f6, #2563eb)', 
          border: 'none',
          color: 'white',
          boxShadow: saved ? '0 4px 15px rgba(16,185,129,0.3)' : '0 4px 15px rgba(59,130,246,0.3)'
        }}>
        <Save size={14} />
        {saved ? 'Settings Applied!' : 'Apply System Changes'}
      </button>
    </div>
  )
}
