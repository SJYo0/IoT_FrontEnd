package com.iot_sw.iot_web_backend.device.entity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED) // 안전한 엔티티 생성을 위한 접근 제어
@Table(name = "device_log")
@EntityListeners(AuditingEntityListener.class) // changedAt 자동 기록
public class DeviceLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 연관관계 매핑 (Lazy Loading으로 성능 최적화)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(name = "previous_status", nullable = false, length = 20)
    private String previousStatus;

    @Column(name = "new_status", nullable = false, length = 20)
    private String newStatus;

    @CreatedDate
    @Column(name = "changed_at", nullable = false, updatable = false)
    private LocalDateTime changedAt;

    @Builder
    public DeviceLog(Device device, String previousStatus, String newStatus) {
        this.device = device;
        this.previousStatus = previousStatus;
        this.newStatus = newStatus;
        // changedAt은 Auditing 기능으로 자동 주입됩니다.
    }
}
