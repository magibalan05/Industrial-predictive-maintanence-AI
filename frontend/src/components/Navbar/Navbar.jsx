import React from 'react'
import { Activity, Bell, Wifi, WifiOff, RefreshCw } from 'lucide-react'

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
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="live-dot" />
          <span className="text-sm font-semibold text-white">Real-Time Monitoring</span>
        </div>
        <span className="text-[10px] text-slate-500 hidden md:block">
          Industrial Predictive Maintenance AI
        </span>
      </div>

      {/* Right: Status + Bell */}
      <div className="flex items-center gap-3">
        {/* Last update */}
        <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500">
          <span>Last update:</span>
          <span className="font-mono text-slate-400">{time}</span>
        </div>

        {/* WS Status */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-medium"
          style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.color}33` }}>
          <Icon size={12} className={wsStatus === 'connecting' ? 'animate-spin' : ''} />
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
