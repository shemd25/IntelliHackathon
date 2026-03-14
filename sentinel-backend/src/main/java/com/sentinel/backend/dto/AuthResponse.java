package com.sentinel.backend.dto;

import lombok.*;

import java.util.List;
import java.util.UUID;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AuthResponse {
    private String token;
    private UUID parentId;
    private String email;
    private List<ChildInfo> children;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ChildInfo {
        private UUID id;
        private String name;
    }
}
