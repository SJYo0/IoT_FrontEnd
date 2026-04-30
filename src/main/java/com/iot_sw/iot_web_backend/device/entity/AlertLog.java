package com.iot_sw.iot_web_backend.device.entity;

import com.iot_sw.iot_web_backend.device.enums.AlertCategory;
import com.iot_sw.iot_web_backend.device.enums.AlertSeverity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "alert_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AlertLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 외래키 직접 매핑 (조회용)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "mac_address", referencedColumnName = "mac_id", insertable = false, updatable = false)
    private Device device;

    // 실제 INSERT할 때 사용할 컬럼
    @Column(name = "mac_address", length = 20, nullable = false)
    private String macAddress;

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
    private boolean isRead = false; // 기본값 미확인(false)

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    public void resolve() {
        this.resolvedAt = LocalDateTime.now();
    }
}
