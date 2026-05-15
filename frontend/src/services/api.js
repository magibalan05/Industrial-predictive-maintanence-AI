import axios from 'axios'

const BASE_URL = 'http://localhost:8000'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,   // longer timeout for uploads
})

export const fetchEquipment     = () => api.get('/sensors/equipment')
export const fetchSensorHistory = (equipmentId, limit = 100) =>
  api.get('/sensors/history', { params: { equipment_id: equipmentId, limit } })

export const fetchAlerts        = (limit = 50) =>
  api.get('/reports/alerts', { params: { limit } })

export const fetchRecommendations = (limit = 20) =>
  api.get('/recommendations/', { params: { limit } })

export const fetchAnalytics     = () => api.get('/reports/analytics')
export const fetchPredictions   = (limit = 100) =>
  api.get('/predictions/history', { params: { limit } })

export const predictSensor      = (sensorData) =>
  api.post('/predictions/predict', sensorData)

// ── Upload API ─────────────────────────────────────────────────────────────
export const uploadDataset = (file, onProgress) => {
  const formData = new FormData()
  formData.append('file', file)
  return api.post('/upload/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
}

export const fetchUploadedDatasets  = () => api.get('/upload/datasets')
export const fetchUploadedReadings  = (datasetId, limit = 500) =>
  api.get(`/upload/datasets/${datasetId}/readings`, { params: { limit } })
export const deleteUploadedDataset  = (datasetId) =>
  api.delete(`/upload/datasets/${datasetId}`)

export default api
