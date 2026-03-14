package com.sentinel.backend.config;

import com.sentinel.backend.model.Child;
import com.sentinel.backend.model.Geofence;
import com.sentinel.backend.model.Parent;
import com.sentinel.backend.repository.ChildRepository;
import com.sentinel.backend.repository.GeofenceRepository;
import com.sentinel.backend.repository.ParentRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Seeds the database with demo data on startup (if empty).
 * Creates: 1 parent, 1 child, 1 geofence.
 * Login: parent@sentinel.dev / sentinel123
 */
@Configuration
public class DataSeeder {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    @Bean
    public CommandLineRunner seedData(
            ParentRepository parentRepo,
            ChildRepository childRepo,
            GeofenceRepository geofenceRepo,
            PasswordEncoder passwordEncoder) {

        return args -> {
            if (parentRepo.count() > 0) {
                log.info("Database already seeded, skipping.");
                return;
            }

            log.info("Seeding database with demo data...");

            // Create parent
            Parent parent = Parent.builder()
                    .email("parent@sentinel.dev")
                    .passwordHash(passwordEncoder.encode("sentinel123"))
                    .phone("+1-876-555-0100")
                    .build();
            parent = parentRepo.save(parent);
            log.info("Created parent: {} (id={})", parent.getEmail(), parent.getId());

            // Create child
            Child child = Child.builder()
                    .parent(parent)
                    .name("Demo Child")
                    .deviceToken("demo-device-token")
                    .build();
            child = childRepo.save(child);
            log.info("Created child: {} (id={})", child.getName(), child.getId());

            // Create geofence (centered on Kingston, Jamaica — ~500m radius)
            Geofence geofence = Geofence.builder()
                    .child(child)
                    .name("Home Zone")
                    .centerLat(18.0179)
                    .centerLng(-76.8099)
                    .radiusM(500.0)
                    .active(true)
                    .build();
            geofenceRepo.save(geofence);
            log.info("Created geofence: {} (radius={}m)", geofence.getName(), geofence.getRadiusM());

            log.info("=== Seed complete ===");
            log.info("Login: parent@sentinel.dev / sentinel123");
            log.info("Child ID: {}", child.getId());
        };
    }
}
