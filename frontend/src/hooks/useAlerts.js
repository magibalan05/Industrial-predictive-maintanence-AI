import { useState, useEffect, useCallback } from 'react'
import { addSensorListener } from '../services/sensorService'

const MAX_ALERTS = 100

export function useAlerts() {
  const [alerts, setAlerts]     = useState([])
  const [unreadCount, setUnreadCount] = useState(0)

  const handleUpdate = useCallback((readings) => {
    const newAlerts = readings.flatMap(r =>
      (r.alerts || []).map(a => ({ ...a, id: `${Date.now()}-${Math.random()}` }))
    )
    if (!newAlerts.length) return

    setAlerts(prev => {
      const combined = [...newAlerts, ...prev]
      return combined.slice(0, MAX_ALERTS)
    })
    setUnreadCount(c => c + newAlerts.length)
  }, [])

  useEffect(() => {
    return addSensorListener(handleUpdate)
  }, [handleUpdate])

  const clearUnread = useCallback(() => setUnreadCount(0), [])

  return { alerts, unreadCount, clearUnread }
}
