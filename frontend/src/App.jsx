import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import UploadPage from './pages/Upload'
import { useSensorData } from './hooks/useSensorData'
import { useAlerts } from './hooks/useAlerts'

function AppLayout() {
  const { wsStatus, equipmentData, lastUpdate } = useSensorData()
  const { unreadCount, clearUnread }             = useAlerts()

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      <Navbar
        wsStatus={wsStatus}
        unreadCount={unreadCount}
        onClearAlerts={clearUnread}
        lastUpdate={lastUpdate}
      />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar equipmentData={equipmentData} />
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/"          element={<Dashboard />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports"   element={<Reports />} />
            <Route path="/upload"    element={<UploadPage />} />
            <Route path="/settings"  element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  )
}
