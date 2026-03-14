export interface LocationData {
  lat: number;
  lng: number;
  accuracy: number;
  speed: number | null;
  heading: number | null;
}

export interface MotionData {
  accelX: number;
  accelY: number;
  accelZ: number;
  gyroX: number;
  gyroY: number;
  gyroZ: number;
}

export interface DeviceMeta {
  battery: number;
  network: string;
  appState: string;
}

export interface SensorPayload {
  childId: string;
  sessionId: string;
  timestamp: number;
  location: LocationData;
  motion: MotionData;
  deviceMeta: DeviceMeta;
}

export interface AuthResponse {
  token: string;
  parentId: string;
  email: string;
  children: ChildInfo[];
}

export interface ChildInfo {
  id: string;
  name: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
