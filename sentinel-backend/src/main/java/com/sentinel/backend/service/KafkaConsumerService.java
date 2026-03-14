package com.sentinel.backend.service;

import com.sentinel.backend.dto.SensorPayload;
import com.sentinel.backend.model.LocationLog;
import com.sentinel.backend.model.MotionLog;
import com.sentinel.backend.repository.LocationLogRepository;
import com.sentinel.backend.repository.MotionLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * Consumes sensor events from Kafka, persists to PostgreSQL (async),
 * caches latest location in Redis, and pushes to parent dashboard via WebSocket.
 */
@Service
public class KafkaConsumerService {

    private static final Logger log = LoggerFactory.getLogger(KafkaConsumerService.class);

    private final LocationLogRepository locationLogRepo;
    private final MotionLogRepository motionLogRepo;
    private final LocationService locationService;
    private final SimpMessagingTemplate messagingTemplate;

    public KafkaConsumerService(
            LocationLogRepository locationLogRepo,
            MotionLogRepository motionLogRepo,
            LocationService locationService,
            SimpMessagingTemplate messagingTemplate) {
        this.locationLogRepo = locationLogRepo;
        this.motionLogRepo = motionLogRepo;
        this.locationService = locationService;
        this.messagingTemplate = messagingTemplate;
    }

    @KafkaListener(
            topics = "${sentinel.kafka.topics.location}",
            groupId = "sentinel-location-consumer",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeLocationEvent(SensorPayload payload) {
        try {
            log.debug("Consumed location event for child={}", payload.getChildId());

            // 1. Cache latest location in Redis (fast read for parent dashboard)
            locationService.cacheLatestLocation(payload);

            // 2. Persist to PostgreSQL asynchronously (non-blocking)
            persistLocationAsync(payload);

            // 3. Push to parent dashboard via WebSocket
            messagingTemplate.convertAndSend(
                    "/topic/location/" + payload.getChildId(), payload);

        } catch (Exception e) {
            log.error("Error processing location event for child={}: {}",
                    payload.getChildId(), e.getMessage(), e);
            // In production: send to dead-letter topic
        }
    }

    @KafkaListener(
            topics = "${sentinel.kafka.topics.motion}",
            groupId = "sentinel-motion-consumer",
            containerFactory = "kafkaListenerContainerFactory"
    )
    public void consumeMotionEvent(SensorPayload payload) {
        try {
            log.debug("Consumed motion event for child={}", payload.getChildId());

            // Persist motion data asynchronously
            persistMotionAsync(payload);

        } catch (Exception e) {
            log.error("Error processing motion event for child={}: {}",
                    payload.getChildId(), e.getMessage(), e);
        }
    }

    @Async
    protected void persistLocationAsync(SensorPayload payload) {
        try {
            LocationLog locationLog = LocationLog.builder()
                    .childId(UUID.fromString(payload.getChildId()))
                    .lat(payload.getLocation().getLat())
                    .lng(payload.getLocation().getLng())
                    .accuracy(payload.getLocation().getAccuracy())
                    .speed(payload.getLocation().getSpeed())
                    .heading(payload.getLocation().getHeading())
                    .recordedAt(Instant.ofEpochMilli(payload.getTimestamp()))
                    .build();
            locationLogRepo.save(locationLog);
        } catch (Exception e) {
            log.error("Failed to persist location for child={}: {}",
                    payload.getChildId(), e.getMessage());
        }
    }

    @Async
    protected void persistMotionAsync(SensorPayload payload) {
        try {
            MotionLog motionLog = MotionLog.builder()
                    .childId(UUID.fromString(payload.getChildId()))
                    .accelX(payload.getMotion().getAccelX())
                    .accelY(payload.getMotion().getAccelY())
                    .accelZ(payload.getMotion().getAccelZ())
                    .gyroX(payload.getMotion().getGyroX())
                    .gyroY(payload.getMotion().getGyroY())
                    .gyroZ(payload.getMotion().getGyroZ())
                    .recordedAt(Instant.ofEpochMilli(payload.getTimestamp()))
                    .build();
            motionLogRepo.save(motionLog);
        } catch (Exception e) {
            log.error("Failed to persist motion for child={}: {}",
                    payload.getChildId(), e.getMessage());
        }
    }
}
