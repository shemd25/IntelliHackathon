package com.sentinel.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sentinel.backend.dto.SensorPayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Manages latest-location caching in Redis.
 * Key pattern: sentinel:location:{childId}
 * TTL: 300 seconds (per BE-1.5 spec)
 *
 * SPAIN constraint: this is the ONLY read path for latest location.
 * PostgreSQL is never queried for the latest location.
 */
@Service
public class LocationService {

    private static final Logger log = LoggerFactory.getLogger(LocationService.class);
    private static final String LOCATION_KEY_PREFIX = "sentinel:location:";
    private static final long CACHE_TTL_SECONDS = 300;

    private final RedisTemplate<String, String> redisTemplate;
    private final ObjectMapper objectMapper;

    public LocationService(RedisTemplate<String, String> redisTemplate,
                           ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;
    }

    /**
     * Cache the latest sensor payload for a child in Redis as JSON string.
     * TTL: 300 seconds.
     */
    public void cacheLatestLocation(SensorPayload payload) {
        try {
            String key = LOCATION_KEY_PREFIX + payload.getChildId();

            Map<String, Object> locationSnapshot = Map.of(
                    "childId", payload.getChildId(),
                    "timestamp", payload.getTimestamp(),
                    "lat", payload.getLocation().getLat(),
                    "lng", payload.getLocation().getLng(),
                    "accuracy", payload.getLocation().getAccuracy(),
                    "speed", payload.getLocation().getSpeed(),
                    "heading", payload.getLocation().getHeading(),
                    "battery", payload.getDeviceMeta() != null ? payload.getDeviceMeta().getBattery() : 0,
                    "network", payload.getDeviceMeta() != null ? payload.getDeviceMeta().getNetwork() : "unknown"
            );

            String json = objectMapper.writeValueAsString(locationSnapshot);
            redisTemplate.opsForValue().set(key, json, CACHE_TTL_SECONDS, TimeUnit.SECONDS);

            log.debug("Cached location for child={} (TTL={}s)", payload.getChildId(), CACHE_TTL_SECONDS);
        } catch (Exception e) {
            log.error("Failed to cache location for child={}: {}",
                    payload.getChildId(), e.getMessage(), e);
        }
    }

    /**
     * Get the latest cached location for a child from Redis.
     * Returns null if not found or expired.
     */
    public Map<Object, Object> getLatestLocation(String childId) {
        try {
            String key = LOCATION_KEY_PREFIX + childId;
            String json = redisTemplate.opsForValue().get(key);
            if (json == null || json.isEmpty()) {
                return null;
            }
            // Deserialize to Map<Object, Object> for uniform response shape
            Map<String, Object> parsed = objectMapper.readValue(
                    json, new TypeReference<Map<String, Object>>() {});
            return (Map<Object, Object>) (Map<?, ?>) parsed;
        } catch (Exception e) {
            log.error("Failed to retrieve location cache for child={}: {}", childId, e.getMessage(), e);
            return null;
        }
    }
}
