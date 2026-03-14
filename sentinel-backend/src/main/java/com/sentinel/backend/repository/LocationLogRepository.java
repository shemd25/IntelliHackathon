package com.sentinel.backend.repository;

import com.sentinel.backend.model.LocationLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

public interface LocationLogRepository extends JpaRepository<LocationLog, UUID> {

    Optional<LocationLog> findTopByChildIdOrderByRecordedAtDesc(UUID childId);

    Page<LocationLog> findByChildIdAndRecordedAtAfterOrderByRecordedAtDesc(
            UUID childId, Instant after, Pageable pageable);
}
