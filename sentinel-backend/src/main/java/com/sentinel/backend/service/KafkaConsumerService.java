package com.sentinel.backend.service;

import com.sentinel.backend.dto.SensorPayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

/**
 * Consumes sensor events from Kafka, persists to PostgreSQL (async via AsyncPersistenceService),
 * caches latest location in Redis, and pushes live updates to parent dashboard via WebSocket.
 *
 * SPAIN constraint: persistLocation/persistMotion are delegated to AsyncPersistenceService
 * so @Async proxy interception fires correctly — Kafka consumer threads are never blocked.
 */
@Service
public class KafkaConsumerService {

    private static final Logger log = LoggerFactory.getLogger(KafkaConsumerService.class);

    private final AsyncPersistenceService persistenceService;
    private final LocationService locationService;
    private final SimpMessagingTemplate messagingTemplate;

    public KafkaConsumerService(
            AsyncPersistenceService persistenceService,
            LocationService locationService,
            SimpMessagingTemplate messagingTemplate) {
        this.persistenceService = persistenceService;
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

            // 1. Cache latest location in Redis — fast read path (SPAIN constraint)
            locationService.cacheLatestLocation(payload);

            // 2. Persist to PostgreSQL asynchronously — non-blocking Kafka consumer thread
            persistenceService.persistLocation(payload);

            // 3. Push live update to parent dashboard via WebSocket
            messagingTemplate.convertAndSend(
                    "/topic/location/" + payload.getChildId(), payload);

        } catch (Exception e) {
            log.error("Error processing location event for child={}: {}",
                    payload.getChildId(), e.getMessage(), e);
            // TODO: route to sentinel.location.dlq after 3 consecutive failures
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

            // Persist motion data asynchronously — non-blocking
            persistenceService.persistMotion(payload);

        } catch (Exception e) {
            log.error("Error processing motion event for child={}: {}",
                    payload.getChildId(), e.getMessage(), e);
        }
    }
}
