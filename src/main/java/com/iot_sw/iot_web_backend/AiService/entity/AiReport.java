package com.iot_sw.iot_web_backend.AiService.entity;

import com.iot_sw.iot_web_backend.device.entity.Device;
import jakarta.persistence.*;
import lombok.*;


import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "ai_report")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AiReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Convert(converter = JsonToMapConverter.class)
    @Column(name = "input_data", columnDefinition = "json", nullable = false)
    private Map<String, Object> inputData;

    @Convert(converter = JsonToMapConverter.class)
    @Column(name = "result", columnDefinition = "json", nullable = false)
    private Map<String, Object> result;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}