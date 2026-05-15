const WS_URL = 'ws://localhost:8000/ws'

let socket = null
let reconnectTimer = null
let listeners = []

export function addSensorListener(fn) {
  listeners.push(fn)
  return () => { listeners = listeners.filter(l => l !== fn) }
}

function notifyListeners(data) {
  listeners.forEach(fn => {
    try { fn(data) } catch (e) { console.error('Listener error', e) }
  })
}

export function connectWebSocket(onStatus) {
  if (socket && socket.readyState === WebSocket.OPEN) return

  onStatus?.('connecting')

  socket = new WebSocket(WS_URL)

  socket.onopen = () => {
    onStatus?.('connected')
    clearTimeout(reconnectTimer)
  }

  socket.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data)
      if (payload.type === 'sensor_update') {
        notifyListeners(payload.data)
      }
    } catch (e) {
      console.warn('WS parse error', e)
    }
  }

  socket.onerror = () => onStatus?.('error')

  socket.onclose = () => {
    onStatus?.('disconnected')
    // Auto-reconnect after 3 seconds
    reconnectTimer = setTimeout(() => connectWebSocket(onStatus), 3000)
  }
}

export function disconnectWebSocket() {
  clearTimeout(reconnectTimer)
  socket?.close()
  socket = null
}
