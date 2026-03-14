package com.sentinel.backend.service;

import com.sentinel.backend.dto.LocationData;
import com.sentinel.backend.dto.SensorPayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Manages latest location caching in Redis for fast parent dashboard reads.
 * Uses a Redis hash per child: sentinel:location:{childId}
 */
@Service
public class LocationService {

    private static final Logger log = LoggerFactory.getLogger(LocationService.class);
    private static final String LOCATION_KEY_PREFIX = "sentinel:location:";
    private static final long CACHE_TTL_HOURS = 24;

    private final RedisTemplate<String, Object> redisTemplate;

    public LocationService(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    /**
     * Cache the latest sensor payload for a child in Redis.
     * Stored as a hash for individual field access.
     */
    public void cacheLatestLocation(SensorPayload payload) {
        try {
            String key = LOCATION_KEY_PREFIX + payload.getChildId();
            LocationData loc = payload.getLocation();

            Map<String, Object> fields = new HashMap<>();
            fields.put("lat", String.valueOf(loc.getLat()));
            fields.put("lng", String.valueOf(loc.getLng()));
            fields.put("accuracy", String.valueOf(loc.getAccuracy()));
            fields.put("speed", String.valueOf(loc.getSpeed()));
            fields.put("heading", String.valueOf(loc.getHeading()));
            fields.put("timestamp", String.valueOf(payload.getTimestamp()));
            fields.put("childId", payload.getChildId());

            if (payload.getDeviceMeta() != null) {
                fields.put("battery", String.valueOf(payload.getDeviceMeta().getBattery()));
                fields.put("network", payload.getDeviceMeta().getNetwork());
            }

            redisTemplate.opsForHash().putAll(key, fields);
            redisTemplate.expire(key, CACHE_TTL_HOURS, TimeUnit.HOURS);

            log.debug("Cached location for child={}", payload.getChildId());
        } catch (Exception e) {
            log.error("Failed to cache location for child={}: {}",
                    payload.getChildId(), e.getMessage());
        }
    }

    /**
     * Get the latest cached location for a child from Redis.
     * Returns null if not found.
     */
    public Map<Object, Object> getLatestLocation(String childId) {
        String key = LOCATION_KEY_PREFIX + childId;
        Map<Object, Object> entries = redisTemplate.opsForHash().entries(key);
        return entries.isEmpty() ? null : entries;
    }
}
