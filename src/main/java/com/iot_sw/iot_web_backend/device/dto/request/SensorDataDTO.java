package com.iot_sw.iot_web_backend.device.dto.request;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

@Data
@NoArgsConstructor
public class SensorDataDTO {
    private double temperature;
    private double humidity;
    private double pressure;
    private Integer tvoc;
    private Integer eco2;
    private Integer flameValue;
    private long timestamp;

    // 날짜 자료형 변환
    public LocalDateTime getMeasuredAt() {
        return LocalDateTime.ofInstant(
                Instant.ofEpochMilli(this.timestamp),
                ZoneId.of("Asia/Seoul")
        );
    }
}
