package com.sentinel.backend.dto;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class LocationData {
    private Double lat;
    private Double lng;
    private Double accuracy;
    private Double speed;
    private Double heading;
}
