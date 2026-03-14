package com.sentinel.backend.repository;

import com.sentinel.backend.model.MotionLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface MotionLogRepository extends JpaRepository<MotionLog, UUID> {
}
