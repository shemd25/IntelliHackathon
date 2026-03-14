package com.sentinel.backend.controller;

import com.sentinel.backend.model.Child;
import com.sentinel.backend.model.LocationLog;
import com.sentinel.backend.repository.ChildRepository;
import com.sentinel.backend.repository.LocationLogRepository;
import com.sentinel.backend.service.LocationService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * REST endpoints for child and location data.
 * All endpoints validate JWT ownership — child must belong to authenticated parent.
 */
@RestController
@RequestMapping("/api/children")
public class LocationController {

    private final LocationService locationService;
    private final ChildRepository childRepository;
    private final LocationLogRepository locationLogRepository;

    public LocationController(LocationService locationService,
                              ChildRepository childRepository,
                              LocationLogRepository locationLogRepository) {
        this.locationService = locationService;
        this.childRepository = childRepository;
        this.locationLogRepository = locationLogRepository;
    }

    /**
     * GET /api/children
     * Returns list of children belonging to the authenticated parent.
     */
    @GetMapping
    public ResponseEntity<?> getChildren(Authentication auth) {
        UUID parentId = (UUID) auth.getPrincipal();

        List<Child> children = childRepository.findByParentId(parentId);

        List<Map<String, Object>> response = children.stream()
                .map(child -> Map.<String, Object>of(
                        "id", child.getId(),
                        "name", child.getName(),
                        "avatar", child.getAvatar() != null ? child.getAvatar() : "",
                        "createdAt", child.getCreatedAt()
                ))
                .toList();

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/children/{childId}/location
     * Returns latest location from Redis cache. Never queries PostgreSQL (SPAIN constraint).
     * Validates child ownership before returning data.
     */
    @GetMapping("/{childId}/location")
    public ResponseEntity<?> getLatestLocation(
            @PathVariable UUID childId,
            Authentication auth) {

        UUID parentId = (UUID) auth.getPrincipal();

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

    /**
     * GET /api/children/{childId}/location/history?hours=1&page=0&size=100
     * Returns paginated location history from PostgreSQL.
     * Validates child ownership before returning data.
     */
    @GetMapping("/{childId}/location/history")
    public ResponseEntity<?> getLocationHistory(
            @PathVariable UUID childId,
            @RequestParam(defaultValue = "1") int hours,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "100") int size,
            Authentication auth) {

        UUID parentId = (UUID) auth.getPrincipal();

        if (!childRepository.existsByIdAndParentId(childId, parentId)) {
            return ResponseEntity.status(403)
                    .body(Map.of("error", "Access denied: child does not belong to you"));
        }

        // Clamp hours to prevent unbounded queries
        int clampedHours = Math.min(Math.max(hours, 1), 168); // max 7 days
        int clampedSize = Math.min(Math.max(size, 1), 500);   // max 500 per page

        Instant since = Instant.now().minus(clampedHours, ChronoUnit.HOURS);
        Page<LocationLog> historyPage = locationLogRepository
                .findByChildIdAndRecordedAtAfterOrderByRecordedAtDesc(
                        childId, since, PageRequest.of(page, clampedSize));

        return ResponseEntity.ok(Map.of(
                "childId", childId,
                "hours", clampedHours,
                "page", page,
                "size", clampedSize,
                "totalElements", historyPage.getTotalElements(),
                "totalPages", historyPage.getTotalPages(),
                "data", historyPage.getContent()
        ));
    }
}
