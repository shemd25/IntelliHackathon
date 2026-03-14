# FORGE-MOB Progress

## Phase 1 — Foundation (COMPLETE)

**Date:** 2026-03-14

### Completed Tasks

- [x] **MOB-1.1** Expo React Native project scaffold (`package.json`, `app.json`, `babel.config.js`, `tsconfig.json`)
- [x] **MOB-1.2** App permissions configured (iOS plist + Android manifest) — foreground + background location, motion
- [x] **MOB-1.3** `AuthService.ts` — POST `/api/auth/login`, JWT stored in `expo-secure-store`
- [x] **MOB-1.4** `WebSocketService.ts` — STOMP over native WS, exponential backoff reconnect (1s→30s)
- [x] **MOB-1.5** `SensorStreamService.ts` — `expo-location` at 500ms + `expo-sensors` Accel/Gyro at 500ms → combined `SensorPayload`
- [x] **MOB-1.6** `BackgroundLocationTask.ts` — `expo-task-manager` task registered at module level, `startLocationUpdatesAsync` at 5s
- [x] **MOB-1.7** `LoginScreen.tsx` — email/password form, pre-filled with demo credentials
- [x] **MOB-1.8** `StreamingScreen.tsx` — live status: connection state, Hz counter, payloads sent, last sent age
- [x] **MOB-1.9** `App.tsx` — navigation root, background task import before NavigationContainer
- [x] **MOB-1.10** `Zustand` auth store — token, childId, connectionStatus, payloadsSent
- [x] `.env.example` — `EXPO_PUBLIC_WS_URL`, `EXPO_PUBLIC_API_URL`, demo credentials
- [x] `README.md` — setup commands, architecture diagram, Phase 1 exit checklist

### File Tree

```
sentinel-mobile/
  App.tsx
  app.json
  package.json
  tsconfig.json
  babel.config.js
  .env.example
  README.md
  src/
    constants/config.ts
    types/index.ts
    store/authStore.ts
    services/
      AuthService.ts
      WebSocketService.ts
      SensorStreamService.ts
    tasks/
      BackgroundLocationTask.ts
    screens/
      LoginScreen.tsx
      StreamingScreen.tsx
```

### Key Contracts

- **WS endpoint:** `ws://{host}:8080/ws/sensor` (raw, no SockJS)
- **STOMP destination:** `/app/sensor.stream`
- **Auth:** `Authorization: Bearer {token}` in STOMP CONNECT headers
- **Payload schema:** matches `SensorPayload` DTO in backend exactly
- **Stream rate:** 500ms (2 Hz) foreground, 5000ms background

### Phase 1 Exit Gate Status

- [ ] App runs on physical device
- [ ] Login succeeds with seeded credentials
- [ ] LIVE indicator shows green
- [ ] 2 Hz stream rate visible
- [ ] Parent dashboard map marker moves

**Blocked on:** Nothing from mobile side. Requires backend at public URL (`EXPO_PUBLIC_WS_URL=wss://...`).

### Next Phase (Phase 2)

- Silent SOS gesture detection (shake → alert)
- Anomaly baseline establishment
- Geofence breach notifications on device
- Offline queue (AsyncStorage) for when WS is down
