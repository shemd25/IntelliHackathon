package com.sentinel.backend.service;

import com.sentinel.backend.dto.SensorPayload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.support.SendResult;
import org.springframework.stereotype.Service;

import java.util.concurrent.CompletableFuture;

/**
 * Publishes sensor payloads to Kafka topics.
 * Location and motion data are sent to separate topics for independent processing.
 */
@Service
public class KafkaProducerService {

    private static final Logger log = LoggerFactory.getLogger(KafkaProducerService.class);

    private final KafkaTemplate<String, SensorPayload> kafkaTemplate;

    @Value("${sentinel.kafka.topics.location}")
    private String locationTopic;

    @Value("${sentinel.kafka.topics.motion}")
    private String motionTopic;

    public KafkaProducerService(KafkaTemplate<String, SensorPayload> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
    }

    /**
     * Send the full sensor payload to the location topic, keyed by childId
     * so all events for a child go to the same partition (ordering guarantee).
     */
    public void sendLocationEvent(SensorPayload payload) {
        CompletableFuture<SendResult<String, SensorPayload>> future =
                kafkaTemplate.send(locationTopic, payload.getChildId(), payload);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to send location event for child={}: {}",
                        payload.getChildId(), ex.getMessage());
            } else {
                log.debug("Location event sent for child={}, offset={}",
                        payload.getChildId(),
                        result.getRecordMetadata().offset());
            }
        });
    }

    /**
     * Send motion data to the motion topic for anomaly detection pipeline.
     */
    public void sendMotionEvent(SensorPayload payload) {
        CompletableFuture<SendResult<String, SensorPayload>> future =
                kafkaTemplate.send(motionTopic, payload.getChildId(), payload);

        future.whenComplete((result, ex) -> {
            if (ex != null) {
                log.error("Failed to send motion event for child={}: {}",
                        payload.getChildId(), ex.getMessage());
            } else {
                log.debug("Motion event sent for child={}, offset={}",
                        payload.getChildId(),
                        result.getRecordMetadata().offset());
            }
        });
    }
}
