import React from 'react'
import { Activity, Bell, Wifi, WifiOff, RefreshCw, Clock } from 'lucide-react'



const statusConfig = {
  connected:    { icon: Wifi,       color: '#10b981', label: 'Live',         bg: 'rgba(16,185,129,0.12)' },
  connecting:   { icon: RefreshCw,  color: '#f59e0b', label: 'Connecting…',  bg: 'rgba(245,158,11,0.12)' },
  disconnected: { icon: WifiOff,    color: '#ef4444', label: 'Disconnected', bg: 'rgba(239,68,68,0.12)' },
  error:        { icon: WifiOff,    color: '#ef4444', label: 'Error',        bg: 'rgba(239,68,68,0.12)' },
}

export default function Navbar({ wsStatus, unreadCount, onClearAlerts, lastUpdate }) {
  const cfg   = statusConfig[wsStatus] || statusConfig.connecting
  const Icon  = cfg.icon
  const time  = lastUpdate ? lastUpdate.toLocaleTimeString() : '--:--:--'

  return (
    <header className="h-16 flex items-center justify-between px-6"
      style={{ borderBottom: '1px solid rgba(59,130,246,0.1)', background: 'rgba(8,14,26,0.9)', backdropFilter: 'blur(12px)' }}>

      {/* Left: Title */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-blue-500/10 border border-blue-500/20 shadow-inner">
            <Activity size={20} className="text-blue-400" />
          </div>
          <div>
            <span className="text-sm font-bold text-white tracking-tight uppercase block">Industrial Intelligence</span>
            <span className="text-[9px] text-blue-500 font-bold uppercase tracking-widest">Platform v2.0</span>
          </div>
        </div>
        <span className="text-[10px] text-slate-600 hidden lg:block border-l border-white/10 pl-4 py-1">
          Adaptive Digital Twin Simulation & Explainable AI reasoning
        </span>
      </div>

      {/* Right: Status + Bell */}
      <div className="flex items-center gap-4">
        {/* Last update */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
          <Clock size={12} className="text-slate-500" />
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500 leading-none uppercase">Telemetry Sync</span>
            <span className="text-[10px] font-mono text-slate-400">{time}</span>
          </div>
        </div>

        {/* WS Status */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}44`, boxShadow: `0 0 15px ${cfg.color}11` }}>
          <Icon size={12} className={wsStatus === 'connecting' ? 'animate-spin' : 'animate-pulse'} />
          {cfg.label}
        </div>

        {/* Alert Bell */}
        <button
          onClick={onClearAlerts}
          className="relative p-2 rounded-lg transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          title="Clear alert count"
        >
          <Bell size={16} className="text-slate-400" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
              style={{ background: '#ef4444', color: 'white' }}>
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
