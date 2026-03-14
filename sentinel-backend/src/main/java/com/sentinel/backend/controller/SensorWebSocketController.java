package com.sentinel.backend.controller;

import com.sentinel.backend.dto.SensorPayload;
import com.sentinel.backend.service.KafkaProducerService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.stereotype.Controller;

/**
 * WebSocket STOMP controller that receives sensor payloads from child devices
 * and routes them to Kafka topics for processing.
 *
 * Child device sends to: /app/sensor.stream
 * This controller receives the message and publishes to Kafka.
 * The Kafka consumer then pushes updates to /topic/location/{childId}.
 */
@Controller
public class SensorWebSocketController {

    private static final Logger log = LoggerFactory.getLogger(SensorWebSocketController.class);

    private final KafkaProducerService kafkaProducerService;

    public SensorWebSocketController(KafkaProducerService kafkaProducerService) {
        this.kafkaProducerService = kafkaProducerService;
    }

    /**
     * Receives sensor data from child device via STOMP.
     * Client sends to: /app/sensor.stream
     */
    @MessageMapping("/sensor.stream")
    public void handleSensorData(@Payload SensorPayload payload) {
        try {
            log.debug("Received sensor payload from child={}, ts={}",
                    payload.getChildId(), payload.getTimestamp());

            // Route to Kafka — location and motion go to separate topics
            if (payload.getLocation() != null) {
                kafkaProducerService.sendLocationEvent(payload);
            }
            if (payload.getMotion() != null) {
                kafkaProducerService.sendMotionEvent(payload);
            }
        } catch (Exception e) {
            log.error("Error handling sensor data from child={}: {}",
                    payload.getChildId(), e.getMessage(), e);
        }
    }
}
