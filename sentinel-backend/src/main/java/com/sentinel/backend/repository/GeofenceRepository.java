package com.sentinel.backend.repository;

import com.sentinel.backend.model.Geofence;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface GeofenceRepository extends JpaRepository<Geofence, UUID> {
    List<Geofence> findByChildIdAndActiveTrue(UUID childId);
}
