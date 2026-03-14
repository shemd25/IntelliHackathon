package com.sentinel.backend.repository;

import com.sentinel.backend.model.Child;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface ChildRepository extends JpaRepository<Child, UUID> {
    List<Child> findByParentId(UUID parentId);
    boolean existsByIdAndParentId(UUID childId, UUID parentId);
}
