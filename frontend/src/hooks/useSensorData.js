import { useState, useEffect, useCallback, useRef } from 'react'
import { connectWebSocket, disconnectWebSocket, addSensorListener } from '../services/sensorService'

const MAX_HISTORY = 30  // points per sensor in rolling chart window

export function useSensorData() {
  const [wsStatus, setWsStatus]       = useState('connecting')
  const [equipmentData, setEquipmentData] = useState({})
  const [sensorHistory, setSensorHistory] = useState({}) // { eq_id: { temp: [], vib: [], ... } }
  const [lastUpdate, setLastUpdate]    = useState(null)

  const handleUpdate = useCallback((readings) => {
    setLastUpdate(new Date())
    setEquipmentData(prev => {
      const next = { ...prev }
      readings.forEach(r => {
        next[r.sensor.equipment_id] = r
      })
      return next
    })

    setSensorHistory(prev => {
      const next = { ...prev }
      readings.forEach(r => {
        const id = r.sensor.equipment_id
        if (!next[id]) next[id] = { temperature: [], vibration: [], voltage: [], current: [], pressure: [], rpm: [] }

        const ts = new Date(r.sensor.timestamp).toLocaleTimeString()
        const push = (arr, val) => {
          const updated = [...arr, { time: ts, value: val }]
          return updated.length > MAX_HISTORY ? updated.slice(-MAX_HISTORY) : updated
        }

        next[id] = {
          temperature: push(next[id].temperature, r.sensor.temperature),
          vibration:   push(next[id].vibration,   r.sensor.vibration),
          voltage:     push(next[id].voltage,      r.sensor.voltage),
          current:     push(next[id].current,      r.sensor.current),
          pressure:    push(next[id].pressure,     r.sensor.pressure),
          rpm:         push(next[id].rpm,          r.sensor.rpm),
        }
      })
      return next
    })
  }, [])

  useEffect(() => {
    const removeListener = addSensorListener(handleUpdate)
    connectWebSocket(setWsStatus)
    return () => {
      removeListener()
      disconnectWebSocket()
    }
  }, [handleUpdate])

  const equipmentList = Object.values(equipmentData)

  return { wsStatus, equipmentData, equipmentList, sensorHistory, lastUpdate }
}
