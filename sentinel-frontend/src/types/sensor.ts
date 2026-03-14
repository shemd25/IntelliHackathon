export interface LocationData {
  lat: number
  lng: number
  accuracy: number
  speed: number
  heading: number
}

export interface MotionData {
  accelX: number
  accelY: number
  accelZ: number
  gyroX: number
  gyroY: number
  gyroZ: number
}

export interface DeviceMeta {
  battery: number
  network: string
  appState: 'foreground' | 'background' | 'inactive'
}

export interface SensorPayload {
  childId: string
  sessionId: string
  timestamp: number
  location: LocationData
  motion: MotionData
  deviceMeta: DeviceMeta
}

export interface Child {
  id: string
  name: string
  parentId: string
}

export interface Geofence {
  id: string
  childId: string
  name: string
  centerLat: number
  centerLng: number
  radiusMeters: number
  active: boolean
}

export interface AlertItem {
  id: string
  childId: string
  type: 'GEOFENCE_BREACH' | 'SOS' | 'ANOMALY' | 'OFFLINE'
  message: string
  timestamp: number
  lat?: number
  lng?: number
  resolved: boolean
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error'
