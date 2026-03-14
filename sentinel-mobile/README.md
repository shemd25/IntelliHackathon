# Sentinel Mobile

React Native / Expo child device app — streams GPS + motion data at 500ms to the Sentinel backend via WebSocket STOMP.

## Prerequisites

- Node.js 18+
- Expo CLI: `npm install -g expo-cli` or use `npx expo`
- Expo Go app on a physical device (iOS/Android) **or** Android emulator / iOS simulator
- Backend running (see `sentinel-backend/README.md`)

## Setup

```bash
cd sentinel-mobile

# Install dependencies
npm install

# Copy env config
cp .env.example .env

# Edit .env with your backend URL
# For local dev:   EXPO_PUBLIC_WS_URL=ws://YOUR_LAN_IP:8080/ws/sensor
# For production:  EXPO_PUBLIC_WS_URL=wss://your-railway-app.railway.app/ws/sensor
```

> **Important:** When testing on a physical device, `localhost` resolves to the device itself.
> Use your machine's LAN IP (e.g., `192.168.1.x`) or the deployed Railway URL.

## Run

```bash
# Start Expo dev server
npx expo start

# Scan the QR code with Expo Go, or press:
# a — Android emulator
# i — iOS simulator
```

## Demo Login

```
Email:    parent@sentinel.dev
Password: sentinel123
```

(Seeded by the backend `DataSeeder` on first startup)

## Architecture

```
LoginScreen
  → POST /api/auth/login
  → JWT stored in SecureStore
  → Navigate to StreamingScreen

StreamingScreen (mounts)
  → WebSocketService.connect(token)       STOMP over native WS
  → SensorStreamService.start(childId)    GPS + Accel + Gyro at 500ms
  → startBackgroundLocationUpdates()      Background task (5s interval)

Every 500ms:
  SensorStreamService._sendPayload()
    → composes SensorPayload (location + motion + deviceMeta)
    → WebSocketService.sendPayload()
      → STOMP publish to /app/sensor.stream
      → Backend routes to Kafka → persists → broadcasts to /topic/location/{childId}
```

## WebSocket Reconnect

Uses exponential backoff: 1s → 2s → 4s → 8s → 16s → 30s (capped).
Managed by `WebSocketService._scheduleReconnect()`.

## Phase 1 Exit Checklist

- [ ] App runs on physical device via Expo Go
- [ ] Login with `parent@sentinel.dev / sentinel123` succeeds
- [ ] `connectionStatus` shows **LIVE** (green) in StreamingScreen
- [ ] `Stream Rate` shows **2 Hz** (2 payloads/sec)
- [ ] `Payloads Sent` counter increments continuously
- [ ] Parent dashboard map marker moves when device moves
- [ ] Background location updates work when app is minimized
- [ ] Production backend URL set in `.env` (wss://)

## Key Files

| File | Purpose |
|------|---------|
| `App.tsx` | Navigation root; registers background task |
| `src/services/WebSocketService.ts` | STOMP client with exponential backoff reconnect |
| `src/services/SensorStreamService.ts` | GPS + Accel + Gyro → 500ms stream |
| `src/services/AuthService.ts` | Login + SecureStore JWT management |
| `src/tasks/BackgroundLocationTask.ts` | expo-task-manager background location |
| `src/screens/StreamingScreen.tsx` | Live status dashboard |
| `src/constants/config.ts` | `WS_URL`, `API_URL`, task names, intervals |
