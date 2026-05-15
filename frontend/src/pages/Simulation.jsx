import api from '../services/api'
import { Cpu, Activity, RefreshCw, Zap, ShieldCheck, Clock } from 'lucide-react'

export default function Simulation() {
  const { equipmentList } = useSensorData()
  const [load, setLoad] = React.useState(1.0)
  const [isFaulting, setIsFaulting] = React.useState(false)

  const handleControl = async (newLoad, inject) => {
    try {
      await api.post('/sensors/control', { load_factor: newLoad, inject_fault: inject })
      setLoad(newLoad)
      if (inject) {
        setIsFaulting(true)
        setTimeout(() => setIsFaulting(false), 5000)
      }
    } catch (e) {
      console.error('Control error', e)
    }
  }

  return (
    <div className="p-6 flex flex-col gap-6 page-enter">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <RefreshCw size={20} className="text-blue-400" /> Digital Twin Control Center
        </h1>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold">
          <Activity size={12} className="animate-pulse" /> SIMULATION ACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
            The Digital Twin Simulation Layer generates high-fidelity industrial telemetry using virtual replicas of physical assets. 
            Each twin monitors 8 distinct parameters including thermal dynamics, rotational load factors, and mechanical vibration patterns.
          </p>
        </div>

        {/* Enterprise Simulation Controller */}
        <div className="glass-card p-6 border-blue-500/20 bg-blue-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl -mr-16 -mt-16 rounded-full" />
          <h3 className="text-[10px] font-bold text-white mb-5 flex items-center gap-2 uppercase tracking-widest">
            <Zap size={14} className="text-yellow-400" /> Digital Twin Global Override
          </h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Global Load Factor</span>
                <span className="text-xs font-black text-blue-400">{(load * 100).toFixed(0)}%</span>
              </div>
              <input 
                type="range" min="0.5" max="2.0" step="0.1" value={load}
                onChange={(e) => handleControl(parseFloat(e.target.value), false)}
                className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500" 
              />
            </div>
            <button 
              onClick={() => handleControl(load, true)}
              disabled={isFaulting}
              className={`w-full py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                isFaulting 
                  ? 'bg-red-500/40 border-none text-white animate-pulse' 
                  : 'bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 shadow-red-500/10'
              }`}>
              {isFaulting ? 'FAULT SIGNATURE INJECTED' : 'INJECT CRITICAL FAULT'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
        {equipmentList.map(eq => {
          const s = eq.sensor || {}
          const p = eq.prediction || {}
          const isAnomaly = s.anomaly_active
          
          return (
            <div key={s.equipment_id} className="glass-card p-5 relative overflow-hidden group">
              {isAnomaly && (
                <div className="absolute top-0 right-0 p-1 bg-red-500/20 text-red-400 text-[8px] font-bold px-2 rounded-bl-lg border-l border-b border-red-500/30">
                  ANOMALY DETECTED
                </div>
              )}
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-colors group-hover:bg-blue-500/20"
                  style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}>
                  <Cpu size={18} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">{s.equipment_name}</h3>
                  <p className="text-[10px] text-slate-500">Asset Twin: {s.equipment_type}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">Operational Load</span>
                  <span className="text-[10px] font-mono text-blue-400">{(s.load_factor * 100 || 100).toFixed(0)}%</span>
                </div>
                <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${(s.load_factor * 100 || 100)}%` }} />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-[8px] text-slate-500 uppercase">Temp</p>
                    <p className="text-xs font-bold text-slate-300">{s.temperature}°C</p>
                  </div>
                  <div className="p-2 rounded-lg bg-white/5 border border-white/5">
                    <p className="text-[8px] text-slate-500 uppercase">Vibration</p>
                    <p className="text-xs font-bold text-slate-300">{s.vibration}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-green-500" />
                  <span className="text-[9px] text-slate-500 uppercase">Twin Status</span>
                </div>
                <span className="text-[9px] font-bold text-green-500">SYNCED</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
