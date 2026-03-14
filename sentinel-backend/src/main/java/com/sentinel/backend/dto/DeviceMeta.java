package com.sentinel.backend.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DeviceMeta {
    private Integer battery;
    private String network;
    private String appState;
}
