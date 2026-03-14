package com.sentinel.backend.controller;

import com.sentinel.backend.dto.SensorPayload;
import com.sentinel.backend.repository.ChildRepository;
import com.sentinel.backend.service.KafkaProducerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.stereotype.Controller;

import java.security.Principal;
import java.util.UUID;

/**
 * WebSocket STOMP controller that receives sensor payloads from child devices
 * and routes them to Kafka topics for processing.
 *
 * Client sends to: /app/sensor.stream
 * Validates: JWT principal must own the childId in the payload.
 */
@Controller
public class SensorWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(SensorWebSocketController.class);

    private final KafkaProducerService kafkaProducerService;
    private final ChildRepository childRepository;

    public SensorWebSocketController(KafkaProducerService kafkaProducerService,
                                     ChildRepository childRepository) {
        this.kafkaProducerService = kafkaProducerService;
        this.childRepository = childRepository;
    }

    /**
     * Receives sensor data from child device via STOMP.
     * Client sends to: /app/sensor.stream
     *
     * Validates that childId in payload belongs to the authenticated parent
     * before forwarding to Kafka.
     */
    @MessageMapping("/sensor.stream")
    public void handleSensorData(
            @Payload SensorPayload payload,
            SimpMessageHeaderAccessor headerAccessor) {

        try {
            Principal principal = headerAccessor.getUser();
            if (principal == null) {
                log.warn("Rejected unauthenticated sensor payload for child={}", payload.getChildId());
                return;
            }

            // Extract parentId from JWT principal (set by JwtChannelInterceptor on CONNECT)
            UUID parentId = UUID.fromString(principal.getName());

            // Ownership validation: childId must belong to authenticated parent
            UUID childId = UUID.fromString(payload.getChildId());
            if (!childRepository.existsByIdAndParentId(childId, parentId)) {
                log.warn("Rejected sensor payload: child={} does not belong to parent={}",
                        payload.getChildId(), parentId);
                return;
            }

            log.debug("Received sensor payload from child={}, ts={}", payload.getChildId(), payload.getTimestamp());

            // Route to Kafka — location and motion go to separate topics
            if (payload.getLocation() != null) {
                kafkaProducerService.sendLocationEvent(payload);
            }
            if (payload.getMotion() != null) {
                kafkaProducerService.sendMotionEvent(payload);
            }
        } catch (IllegalArgumentException e) {
            log.error("Invalid UUID in sensor payload: {}", e.getMessage());
        } catch (Exception e) {
            log.error("Error handling sensor data from child={}: {}",
                    payload.getChildId(), e.getMessage(), e);
        }
    }
}
