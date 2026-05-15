import { useState, useEffect } from 'react'
import { fetchUploadedReadings } from '../services/api'

export function useUploadedData(datasetId) {
  const [equipmentData, setEquipmentData] = useState({})
  const [sensorHistory, setSensorHistory] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!datasetId) {
      setEquipmentData({})
      setSensorHistory({})
      return
    }

    let isMounted = true
    setLoading(true)

    fetchUploadedReadings(datasetId, 1000)
      .then(res => {
        if (!isMounted) return
        const rows = res.data.rows || []
        
        // Build equipmentData (latest row for each equipment)
        const newEqData = {}
        const newHistory = {}

        rows.forEach(r => {
          const id = r.equipment_id || 'UP-001'
          
          // Latest row representation
          newEqData[id] = {
            sensor: {
              equipment_id: id,
              equipment_name: r.equipment_name,
              equipment_type: r.equipment_type,
              temperature: r.temperature,
              vibration: r.vibration,
              voltage: r.voltage,
              current: r.current,
              pressure: r.pressure,
              rpm: r.rpm,
              timestamp: r.timestamp,
            },
            prediction: {
              risk_level: r.risk_level,
              risk_label: r.risk_label,
              confidence: r.confidence,
              health_score: r.health_score,
            },
            alerts: [], // we could compute static alerts here if needed
            recommendations: [] 
          }

          // History tracking (all rows for this equipment)
          if (!newHistory[id]) {
            newHistory[id] = { temperature: [], vibration: [], voltage: [], current: [], pressure: [], rpm: [] }
          }
          
          const ts = new Date(r.timestamp).toLocaleTimeString()
          newHistory[id].temperature.push({ time: ts, value: r.temperature })
          newHistory[id].vibration.push({ time: ts, value: r.vibration })
          newHistory[id].voltage.push({ time: ts, value: r.voltage })
          newHistory[id].current.push({ time: ts, value: r.current })
          newHistory[id].pressure.push({ time: ts, value: r.pressure })
          newHistory[id].rpm.push({ time: ts, value: r.rpm })
        })

        setEquipmentData(newEqData)
        setSensorHistory(newHistory)
      })
      .catch(e => console.error(e))
      .finally(() => {
        if (isMounted) setLoading(false)
      })

    return () => { isMounted = false }
  }, [datasetId])

  const equipmentList = Object.values(equipmentData)

  return { equipmentData, equipmentList, sensorHistory, loading }
}
