# Sentinel Backend

> Spring Boot 3.4 · Java 21 · Kafka · WebSocket · PostgreSQL · Redis

Real-time child safety platform backend for Project Sentinel — Intellibus Hackathon 2026.

## Architecture

```
Child Phone ──WebSocket──► Spring Boot ──Kafka──► Consumer ──► PostgreSQL
                                │                     │
                                │                     ├──► Redis (cache)
                                │                     │
                                │                     └──► WebSocket ──► Parent Dashboard
                                │
                                └──► REST API (JWT auth)
```

## Prerequisites

- **Java 21** (any distribution: Temurin, Corretto, GraalVM)
- **Docker + Docker Compose** (for PostgreSQL, Redis, Kafka)
- **Maven** (included via `mvnw` wrapper — no install needed)

## Quick Start

### 1. Start Infrastructure

```bash
docker-compose up -d
```

This starts:
| Service     | Port  | Purpose                    |
|-------------|-------|----------------------------|
| PostgreSQL  | 5432  | Primary database           |
| Redis       | 6379  | Location cache             |
| Kafka       | 9092  | Event streaming            |
| Kafka UI    | 9090  | Kafka monitoring dashboard |

Wait for all services to be healthy:

```bash
docker-compose ps
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env if needed (defaults work for local dev)
```

### 3. Run the Backend

```bash
./mvnw spring-boot:run
```

The server starts on `http://localhost:8080`. On first run, it seeds the database with demo data.

### 4. Verify Setup

**Health check:**
```bash
curl http://localhost:8080/api/auth/health
```

**Login (get JWT):**
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"parent@sentinel.dev","password":"sentinel123"}'
```

The response includes a JWT token and the child ID:
```json
{
  "token": "eyJ...",
  "parentId": "uuid",
  "email": "parent@sentinel.dev",
  "children": [{"id": "child-uuid", "name": "Demo Child"}]
}
```

**Get latest location (with JWT):**
```bash
curl http://localhost:8080/api/children/{childId}/location \
  -H "Authorization: Bearer {token}"
```

### 5. Monitor Kafka

Open Kafka UI at [http://localhost:9090](http://localhost:9090) to see topics and messages.

## API Endpoints

| Method | Path                              | Auth   | Description                |
|--------|-----------------------------------|--------|----------------------------|
| POST   | `/api/auth/login`                 | Public | Login, returns JWT         |
| GET    | `/api/auth/health`                | Public | Health check               |
| GET    | `/api/children/{childId}/location`| JWT    | Latest location from Redis |

## WebSocket (STOMP)

**Endpoint:** `ws://localhost:8080/ws/sensor` (or with SockJS: `http://localhost:8080/ws/sensor`)

**Authentication:** Send JWT in STOMP CONNECT headers:
```
CONNECT
Authorization:Bearer {token}
```

**Send sensor data (child device):**
```
SEND
destination:/app/sensor.stream

{"childId":"uuid","sessionId":"uuid","timestamp":1710000000000,"location":{"lat":18.0179,"lng":-76.8099,"accuracy":4.2,"speed":1.3,"heading":247.0},"motion":{"accelX":0.12,"accelY":-0.03,"accelZ":9.81,"gyroX":0.001,"gyroY":0.002,"gyroZ":0.0},"deviceMeta":{"battery":87,"network":"4G","appState":"background"}}
```

**Subscribe to location updates (parent dashboard):**
```
SUBSCRIBE
destination:/topic/location/{childId}
```

## Kafka Topics

| Topic                       | Partitions | Retention | Purpose                    |
|-----------------------------|------------|-----------|----------------------------|
| `sentinel.location.stream`  | 3          | 24h       | GPS + location events      |
| `sentinel.motion.stream`    | 3          | 6h        | Accelerometer/gyroscope    |
| `sentinel.alerts.outbound`  | 1          | 72h       | Alert notifications        |

## Project Structure

```
src/main/java/com/sentinel/backend/
├── SentinelBackendApplication.java    # Entry point
├── config/
│   ├── CorsConfig.java                # CORS (all origins for hackathon)
│   ├── DataSeeder.java                # Demo data on first start
│   ├── KafkaConsumerConfig.java       # Consumer factory + deserialization
│   ├── KafkaTopicConfig.java          # Auto-create topics
│   ├── RedisConfig.java               # Redis template
│   ├── SecurityConfig.java            # JWT filter chain
│   └── WebSocketConfig.java           # STOMP + SockJS
├── security/
│   ├── JwtTokenProvider.java          # Generate/validate JWT
│   ├── JwtAuthFilter.java            # HTTP request JWT filter
│   └── JwtChannelInterceptor.java     # WebSocket STOMP JWT auth
├── model/
│   ├── Parent.java, Child.java        # Core entities
│   ├── Geofence.java                  # Geofence zones
│   ├── LocationLog.java, MotionLog.java  # Sensor logs
│   └── Alert.java                     # Alert events
├── repository/                        # JPA repositories
├── dto/                               # Request/response DTOs
├── service/
│   ├── KafkaProducerService.java      # Publish to Kafka
│   ├── KafkaConsumerService.java      # Consume + persist + push
│   ├── LocationService.java           # Redis location cache
│   └── AuthService.java               # Login logic
└── controller/
    ├── SensorWebSocketController.java # WebSocket message handler
    ├── AuthController.java            # POST /auth/login
    └── LocationController.java        # GET /children/{id}/location
```

## Demo Credentials

| Role   | Email                  | Password      |
|--------|------------------------|---------------|
| Parent | `parent@sentinel.dev`  | `sentinel123` |

## Phase 1 Exit Checklist — Backend

- [ ] `docker-compose up -d` — all 4 services healthy
- [ ] `./mvnw spring-boot:run` — compiles and starts without errors
- [ ] POST `/api/auth/login` returns JWT
- [ ] WebSocket STOMP CONNECT with JWT succeeds
- [ ] Sensor payload via WebSocket appears in Kafka UI
- [ ] GET `/children/{childId}/location` returns cached data
- [ ] Backend accessible via public URL (Railway / EC2 / ngrok)
