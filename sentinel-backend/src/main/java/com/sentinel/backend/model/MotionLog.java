package com.sentinel.backend.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "motion_log", indexes = {
    @Index(name = "idx_motion_child_time", columnList = "child_id, recorded_at DESC")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MotionLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "child_id", nullable = false)
    private UUID childId;

    @Column(name = "accel_x")
    private Double accelX;

    @Column(name = "accel_y")
    private Double accelY;

    @Column(name = "accel_z")
    private Double accelZ;

    @Column(name = "gyro_x")
    private Double gyroX;

    @Column(name = "gyro_y")
    private Double gyroY;

    @Column(name = "gyro_z")
    private Double gyroZ;

    @Column(name = "recorded_at", nullable = false)
    private Instant recordedAt;
}
