package com.iot_sw.iot_web_backend.device.entity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_telemetry")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class SensorTelemetry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 💡 단일 객체 연관관계로 변경
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(precision = 5, scale = 2)
    private BigDecimal temperature;

    @Column(precision = 5, scale = 2)
    private BigDecimal humidity;

    @Column(precision = 6, scale = 2)
    private BigDecimal pressure;

    @Column(columnDefinition = "SMALLINT UNSIGNED")
    private Integer tvoc;

    @Column(columnDefinition = "SMALLINT UNSIGNED")
    private Integer eco2;

    @Column(columnDefinition = "SMALLINT")
    private Integer flameValue;

    @Column(nullable = false)
    private LocalDateTime measuredAt;
}