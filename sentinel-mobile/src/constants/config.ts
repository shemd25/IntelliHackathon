import Constants from 'expo-constants';

// Sensor stream interval — 500ms as required by SPAIN constraints
export const STREAM_INTERVAL_MS = 500;

// Background task name
export const BACKGROUND_LOCATION_TASK = 'sentinel-background-location';

/**
 * Derive the backend host from the Expo dev server host so the app works on
 * physical devices without manually setting a LAN IP.
 *
 * Constants.expoConfig?.hostUri looks like "192.168.1.42:8081".
 * We strip the port and use port 8080 for the backend.
 *
 * Falls back to EXPO_PUBLIC_API_URL env var (set this for production).
 */
function resolveBackendHost(): string {
  // Explicit env var always wins (use for production wss:// URLs)
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // In Expo Go / dev builds, derive IP from the dev server host
  const devHost: string | undefined =
    Constants.expoConfig?.hostUri ??
    // @ts-ignore — older Expo SDK fallback
    Constants.manifest?.debuggerHost;
  if (devHost) {
    const ip = devHost.split(':')[0]; // strip the Metro bundler port
    return `http://${ip}:8080`;
  }
  return 'http://localhost:8080';
}

export const API_URL = resolveBackendHost();

// Derive WS URL from API URL (http→ws, https→wss)
export const WS_URL =
  process.env.EXPO_PUBLIC_WS_URL ??
  API_URL.replace(/^http/, 'ws') + '/ws/sensor';

// SecureStore keys
export const STORE_KEY_TOKEN = 'sentinel_jwt';
export const STORE_KEY_CHILD_ID = 'sentinel_child_id';
export const STORE_KEY_CHILD_NAME = 'sentinel_child_name';

// WebSocket reconnect — exponential backoff bounds
export const WS_RECONNECT_BASE_MS = 1000;
export const WS_RECONNECT_MAX_MS = 30000;
