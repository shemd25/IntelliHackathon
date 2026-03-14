package com.sentinel.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@JsonIgnoreProperties(ignoreUnknown = true)
public class SensorPayload {
    private String childId;
    private String sessionId;
    private Long timestamp;
    private LocationData location;
    private MotionData motion;
    private DeviceMeta deviceMeta;
}
