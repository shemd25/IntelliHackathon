# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Sentinel** — a real-time child safety platform built for Intellibus Hackathon 2026. Child devices stream GPS + motion sensor data at 500ms intervals via WebSocket → Kafka → Spring Boot backend → Parent dashboard map.

**Planned components (only backend exists so far):**
- `sentinel-backend/` — Spring Boot 3.x / Java 21 (complete)
- `sentinel-mobile/` — React Native / Expo (pending)
- `sentinel-frontend/` — React 18 + Vite + Mapbox GL JS (pending)

## Backend Commands

All commands run from `sentinel-backend/`:

```bash
# Start infrastructure (PostgreSQL, Redis, Kafka, Kafka UI)
docker-compose up -d

# Run the app (requires infrastructure running)
./mvnw spring-boot:run

# Build JAR
./mvnw clean package

# Run tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=ClassName

# Build Docker image
docker build -t sentinel-backend:latest .
```

**Kafka UI:** http://localhost:9090
**API base:** http://localhost:8080

## Architecture

**Data flow:**
```
Child phone → WebSocket STOMP (JWT) → SensorWebSocketController
    → KafkaProducerService → [sentinel.location.stream, sentinel.motion.stream]
    → KafkaConsumerService → PostgreSQL (async persist) + Redis (latest-location cache)
    → SimpMessagingTemplate → WebSocket broadcast → /topic/location/{childId}
    → Parent dashboard
```

**Key packages** (`src/main/java/com/sentinel/backend/`):
- `controller/` — `SensorWebSocketController` (STOMP `/app/sensor.stream`), `AuthController` (`POST /api/auth/login`), `LocationController` (`GET /api/children/{childId}/location`)
- `service/` — `KafkaProducerService`, `KafkaConsumerService` (processes both topics), `LocationCacheService` (Redis), `AuthService`
- `security/` — JWT token provider + Spring Security filter chain
- `config/` — WebSocket, Kafka, Redis, Security, CORS configs + `DataSeeder` (seeds demo data on first start)
- `model/` — JPA entities: `Parent`, `Child`, `Geofence`, `LocationLog`, `MotionLog`, `Alert`

**Infrastructure (docker-compose):**
| Service | Port | Notes |
|---------|------|-------|
| PostgreSQL 15 | 5433 | External; 5432 internal |
| Redis 7 | 6379 | Latest-location cache |
| Kafka 3.7.0 | 9092 | KRaft mode (no Zookeeper) |
| Kafka UI | 9090 | Monitoring dashboard |

**Kafka topics:** `sentinel.location.stream` (3 partitions, 24h retention), `sentinel.motion.stream` (3 partitions, 6h retention), `sentinel.alerts.outbound` (1 partition, 72h retention)

**Auth:** All endpoints require JWT except `/api/auth/*`. JWT passed in WebSocket CONNECT headers and HTTP `Authorization: Bearer` header.

## Demo Credentials (seeded by DataSeeder)

- **Parent login:** `parent@sentinel.dev` / `sentinel123`
- **Child:** "Demo Child" with geofence near Kingston, Jamaica

## Environment Config

Copy `sentinel-backend/.env.example` to `sentinel-backend/.env`. Key variables: `DB_HOST`, `KAFKA_BOOTSTRAP_SERVERS`, `REDIS_HOST`, `JWT_SECRET`. All have localhost defaults for local dev.

## Sensor Payload Schema

```json
{
  "childId": "uuid",
  "sessionId": "uuid",
  "timestamp": 1710000000000,
  "location": { "lat": 18.0179, "lng": -76.8099, "accuracy": 4.2, "speed": 1.3, "heading": 247.0 },
  "motion": { "accelX": 0.12, "accelY": -0.03, "accelZ": 9.81, "gyroX": 0.001, "gyroY": 0.002, "gyroZ": 0.000 },
  "deviceMeta": { "battery": 87, "network": "4G", "appState": "background" }
}
```

## SPAIN Constraints (Non-Negotiable)

- **Performance:** Location inserts must be async/non-blocking. Redis is the read path for latest location — never query PostgreSQL for this.
- **Integrity:** Use JPA repositories only — no raw SQL. Validate `childId` belongs to the authenticated parent.
- **Availability:** Services must be live at a public HTTPS URL (Railway/Vercel/Supabase recommended over AWS for speed).
- **Stability:** WebSocket must auto-reconnect with exponential backoff. Kafka consumer needs dead-letter topic handling.

## Deployment Options

Fast path (recommended for hackathon): Railway (backend) + Vercel (frontend) + Supabase (PostgreSQL) + Upstash (Redis) + Confluent Cloud (Kafka).
