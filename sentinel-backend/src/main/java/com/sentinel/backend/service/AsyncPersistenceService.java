package com.sentinel.backend.service;

import com.sentinel.backend.dto.SensorPayload;
import com.sentinel.backend.model.LocationLog;
import com.sentinel.backend.model.MotionLog;
import com.sentinel.backend.repository.LocationLogRepository;
import com.sentinel.backend.repository.MotionLogRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

/**
 * Handles all async database persistence operations.
 * Extracted into its own Spring bean so @Async proxy interception works correctly.
 * (Spring AOP cannot intercept self-calls within the same bean instance.)
 */
@Service
public class AsyncPersistenceService {

    private static final Logger log = LoggerFactory.getLogger(AsyncPersistenceService.class);

    private final LocationLogRepository locationLogRepo;
    private final MotionLogRepository motionLogRepo;

    public AsyncPersistenceService(LocationLogRepository locationLogRepo,
                                   MotionLogRepository motionLogRepo) {
        this.locationLogRepo = locationLogRepo;
        this.motionLogRepo = motionLogRepo;
    }

    /**
     * Persist location data to PostgreSQL asynchronously.
     * Runs on the Spring TaskExecutor thread pool — never blocks the Kafka consumer thread.
     */
    @Async
    public void persistLocation(SensorPayload payload) {
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
            log.debug("Persisted location for child={}", payload.getChildId());
        } catch (Exception e) {
            log.error("Failed to persist location for child={}: {}",
                    payload.getChildId(), e.getMessage(), e);
        }
    }

    /**
     * Persist motion data to PostgreSQL asynchronously.
     * Runs on the Spring TaskExecutor thread pool — never blocks the Kafka consumer thread.
     */
    @Async
    public void persistMotion(SensorPayload payload) {
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
            log.debug("Persisted motion for child={}", payload.getChildId());
        } catch (Exception e) {
            log.error("Failed to persist motion for child={}: {}",
                    payload.getMotion(), e.getMessage(), e);
        }
    }
}
