package com.sentinel.backend.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class MotionData {
    private Double accelX;
    private Double accelY;
    private Double accelZ;
    private Double gyroX;
    private Double gyroY;
    private Double gyroZ;
}
