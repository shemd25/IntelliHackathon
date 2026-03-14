/**
 * Background location task — registered at module level (required by expo-task-manager).
 * This file MUST be imported in App.tsx before any component renders.
 *
 * When the app is backgrounded, expo-location fires this task with fresh location objects.
 * The task sends the location via WebSocketService if the connection is alive.
 */
import * as TaskManager from 'expo-task-manager';
import * as Location from 'expo-location';
import * as SecureStore from 'expo-secure-store';
import { v4 as uuidv4 } from 'uuid';
import { BACKGROUND_LOCATION_TASK, STORE_KEY_TOKEN, STORE_KEY_CHILD_ID } from '../constants/config';
import WebSocketService from '../services/WebSocketService';
import { SensorPayload } from '../types';

TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('[BgTask] Location task error:', error.message);
    return;
  }

  if (!data) {
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  const loc = locations[0];
  if (!loc) return;

  try {
    const childId = await SecureStore.getItemAsync(STORE_KEY_CHILD_ID);
    const token = await SecureStore.getItemAsync(STORE_KEY_TOKEN);
    if (!childId || !token) return;

    // Reconnect if disconnected — token available from SecureStore
    if (!WebSocketService.isConnected()) {
      WebSocketService.connect(token);
    }

    const payload: SensorPayload = {
      childId,
      sessionId: uuidv4(),
      timestamp: Date.now(),
      location: {
        lat: loc.coords.latitude,
        lng: loc.coords.longitude,
        accuracy: loc.coords.accuracy ?? 0,
        speed: loc.coords.speed,
        heading: loc.coords.heading,
      },
      motion: {
        accelX: 0, accelY: 0, accelZ: 9.81,
        gyroX: 0, gyroY: 0, gyroZ: 0,
      },
      deviceMeta: {
        battery: -1, // Not available in background without expo-battery in task context
        network: 'background',
        appState: 'background',
      },
    };

    WebSocketService.sendPayload(payload);
  } catch (err) {
    console.error('[BgTask] Failed to send background location:', err);
  }
});

/**
 * Start background location updates.
 * Call this after foreground permissions are granted.
 */
export async function startBackgroundLocationUpdates(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);

  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }

  await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 5000, // 5s in background to preserve battery
    distanceInterval: 5,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Sentinel is active',
      notificationBody: 'Your location is being shared with your parent.',
      notificationColor: '#6366f1',
    },
  });
}

export async function stopBackgroundLocationUpdates(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_LOCATION_TASK);
  if (isRegistered) {
    await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
  }
}
