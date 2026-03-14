package com.sentinel.backend.controller;

import com.sentinel.backend.repository.ChildRepository;
import com.sentinel.backend.service.LocationService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/children")
public class LocationController {

    private final LocationService locationService;
    private final ChildRepository childRepository;

    public LocationController(LocationService locationService, ChildRepository childRepository) {
        this.locationService = locationService;
        this.childRepository = childRepository;
    }

    /**
     * GET /api/children/{childId}/location
     * Returns the latest cached location from Redis.
     * Validates that the child belongs to the authenticated parent.
     */
    @GetMapping("/{childId}/location")
    public ResponseEntity<?> getLatestLocation(
            @PathVariable UUID childId,
            Authentication auth) {

        UUID parentId = (UUID) auth.getPrincipal();

        // Ownership check: child must belong to authenticated parent
        if (!childRepository.existsByIdAndParentId(childId, parentId)) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Access denied: child does not belong to you"));
        }

        Map<Object, Object> location = locationService.getLatestLocation(childId.toString());

        if (location == null) {
            return ResponseEntity.status(404)
                    .body(Map.of("error", "No location data available for this child"));
        }

        return ResponseEntity.ok(location);
    }
}
