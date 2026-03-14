package com.sentinel.backend.repository;

import com.sentinel.backend.model.Alert;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface AlertRepository extends JpaRepository<Alert, UUID> {
    List<Alert> findByChildIdAndResolvedFalseOrderByCreatedAtDesc(UUID childId);
}
