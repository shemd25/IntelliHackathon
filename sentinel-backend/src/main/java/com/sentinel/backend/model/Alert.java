package com.sentinel.backend.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "alerts", indexes = {
    @Index(name = "idx_alerts_child_created", columnList = "child_id, created_at DESC")
})
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "child_id", nullable = false)
    private UUID childId;

    // e.g. GEOFENCE_EXIT, ANOMALY_DETECTED, SOS_SHAKE
    @Column(nullable = false)
    private String type;

    // LOW, MEDIUM, HIGH, CRITICAL
    @Column(nullable = false)
    private String severity;

    // JSON payload with alert-specific data
    @Column(columnDefinition = "TEXT")
    private String payload;

    @Builder.Default
    private Boolean resolved = false;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;
}
