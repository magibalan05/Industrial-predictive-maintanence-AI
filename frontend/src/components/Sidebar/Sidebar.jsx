import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, BarChart2, FileText, Settings,
  Cpu, Zap, Activity, AlertTriangle, Upload
} from 'lucide-react'

const navItems = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/analytics', icon: BarChart2,       label: 'Analytics' },
  { to: '/reports',   icon: FileText,        label: 'Reports' },
  { to: '/upload',    icon: Upload,          label: 'Upload Data' },
  { to: '/settings',  icon: Settings,        label: 'Settings' },
]

const equipment = [
  { id: 'EQ-001', name: 'Motor A',       icon: Cpu,           color: '#3b82f6' },
  { id: 'EQ-002', name: 'Transformer B', icon: Zap,           color: '#8b5cf6' },
  { id: 'EQ-003', name: 'Generator C',   icon: Activity,      color: '#06b6d4' },
  { id: 'EQ-004', name: 'Turbine D',     icon: AlertTriangle, color: '#f59e0b' },
]

export default function Sidebar({ equipmentData = {} }) {
  return (
    <aside className="w-60 shrink-0 flex flex-col gap-6 py-6 px-3"
      style={{ borderRight: '1px solid rgba(59,130,246,0.1)' }}>

      {/* Logo */}
      <div className="px-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
            <Activity size={16} color="white" />
          </div>
          <div>
            <p className="text-xs font-bold text-white leading-tight">PredictiveAI</p>
            <p className="text-[10px] text-slate-500">Maintenance System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3 mb-1">
          Navigation
        </p>
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Equipment Status */}
      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold text-slate-600 uppercase tracking-widest px-3">
          Equipment
        </p>
        {equipment.map(({ id, name, icon: Icon, color }) => {
          const eq = equipmentData[id]
          const risk = eq?.prediction?.risk_label || 'Healthy'
          const statusColor = risk === 'Critical' ? '#ef4444' : risk === 'Warning' ? '#f59e0b' : '#10b981'
          return (
            <div key={id} className="flex items-center gap-3 px-3 py-2 rounded-lg"
              style={{ background: 'rgba(255,255,255,0.02)' }}>
              <Icon size={14} style={{ color }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-300 truncate">{name}</p>
                <p className="text-[10px]" style={{ color: statusColor }}>{risk}</p>
              </div>
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }} />
            </div>
          )
        })}
      </div>

      {/* Footer */}
      <div className="mt-auto px-3">
        <div className="rounded-lg p-3 text-center"
          style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)' }}>
          <p className="text-[10px] text-slate-500">Industrial Predictive</p>
          <p className="text-[10px] text-slate-500">Maintenance AI v1.0</p>
        </div>
      </div>
    </aside>
  )
}
