import * as Location from 'expo-location';
import { Accelerometer, Gyroscope } from 'expo-sensors';
import * as Battery from 'expo-battery';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { STREAM_INTERVAL_MS } from '../constants/config';
import { SensorPayload, LocationData, MotionData } from '../types';
import WebSocketService from './WebSocketService';

type SendCallback = (success: boolean) => void;

class SensorStreamService {
  private childId: string | null = null;
  private sessionId: string = uuidv4();
  private streamTimer: ReturnType<typeof setInterval> | null = null;
  private onSend: SendCallback | null = null;

  // Latest sensor readings (updated by listeners)
  private latestLocation: LocationData | null = null;
  private latestMotion: MotionData = {
    accelX: 0, accelY: 0, accelZ: 9.81,
    gyroX: 0, gyroY: 0, gyroZ: 0,
  };

  private accelSubscription: { remove: () => void } | null = null;
  private gyroSubscription: { remove: () => void } | null = null;
  private locationSubscription: Location.LocationSubscription | null = null;
  private appStateSubscription: { remove: () => void } | null = null;

  private appState: AppStateStatus = AppState.currentState;

  setSendCallback(cb: SendCallback) {
    this.onSend = cb;
  }

  async start(childId: string): Promise<void> {
    if (this.streamTimer) {
      return; // Already running
    }

    this.childId = childId;
    this.sessionId = uuidv4(); // New session on each start

    await this._requestPermissions();
    await this._startLocationWatcher();
    this._startMotionListeners();
    this._startStreamTimer();
    this._watchAppState();
  }

  stop(): void {
    if (this.streamTimer) {
      clearInterval(this.streamTimer);
      this.streamTimer = null;
    }
    this.locationSubscription?.remove();
    this.locationSubscription = null;
    this.accelSubscription?.remove();
    this.accelSubscription = null;
    this.gyroSubscription?.remove();
    this.gyroSubscription = null;
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
    this.childId = null;
  }

  isRunning(): boolean {
    return this.streamTimer !== null;
  }

  private async _requestPermissions(): Promise<void> {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') {
      throw new Error('Foreground location permission denied');
    }

    // Background permission is best-effort — don't block if denied
    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    if (bg !== 'granted') {
      console.warn('[Sensors] Background location permission denied — foreground only');
    }
  }

  private async _startLocationWatcher(): Promise<void> {
    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: STREAM_INTERVAL_MS,
        distanceInterval: 0, // Report every interval regardless of distance
      },
      (loc) => {
        this.latestLocation = {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
          accuracy: loc.coords.accuracy ?? 0,
          speed: loc.coords.speed,
          heading: loc.coords.heading,
        };
      },
    );
  }

  private _startMotionListeners(): void {
    Accelerometer.setUpdateInterval(STREAM_INTERVAL_MS);
    Gyroscope.setUpdateInterval(STREAM_INTERVAL_MS);

    this.accelSubscription = Accelerometer.addListener((data) => {
      this.latestMotion = {
        ...this.latestMotion,
        accelX: data.x,
        accelY: data.y,
        accelZ: data.z,
      };
    });

    this.gyroSubscription = Gyroscope.addListener((data) => {
      this.latestMotion = {
        ...this.latestMotion,
        gyroX: data.x,
        gyroY: data.y,
        gyroZ: data.z,
      };
    });
  }

  private _startStreamTimer(): void {
    this.streamTimer = setInterval(() => {
      this._sendPayload();
    }, STREAM_INTERVAL_MS);
  }

  private _watchAppState(): void {
    this.appStateSubscription = AppState.addEventListener('change', (nextState) => {
      this.appState = nextState;
    });
  }

  private async _sendPayload(): Promise<void> {
    if (!this.childId || !this.latestLocation) {
      return;
    }

    let battery = 100;
    try {
      const level = await Battery.getBatteryLevelAsync();
      battery = Math.round(level * 100);
    } catch {
      // Battery API not available on all platforms
    }

    const payload: SensorPayload = {
      childId: this.childId,
      sessionId: this.sessionId,
      timestamp: Date.now(),
      location: this.latestLocation,
      motion: { ...this.latestMotion },
      deviceMeta: {
        battery,
        network: Platform.OS,
        appState: this.appState,
      },
    };

    const success = WebSocketService.sendPayload(payload);
    this.onSend?.(success);
  }
}

const sensorStreamService = new SensorStreamService();
export default sensorStreamService;
