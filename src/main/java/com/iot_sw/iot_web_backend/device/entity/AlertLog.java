package com.iot_sw.iot_web_backend.device.entity;

import com.iot_sw.iot_web_backend.device.enums.AlertCategory;
import com.iot_sw.iot_web_backend.device.enums.AlertSeverity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "alert_log", indexes = {
        @Index(name = "idx_alert_created_at", columnList = "created_at DESC"),
        @Index(name = "idx_alert_device_severity", columnList = "device_id, severity"),
        @Index(name = "idx_alert_is_read", columnList = "is_read"),
        @Index(name = "idx_alert_resolved_at", columnList = "resolved_at")
})
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AlertLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Enumerated(EnumType.STRING)
    @Column(length = 30, nullable = false)
    private AlertCategory category;

    @Enumerated(EnumType.STRING)
    @Column(length = 20, nullable = false)
    private AlertSeverity severity;

    @Column(nullable = false)
    private String message;

    @Builder.Default
    @Column(name = "is_read", nullable = false)
    private boolean isRead = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public void resolve() {
        this.resolvedAt = LocalDateTime.now();
    }
}