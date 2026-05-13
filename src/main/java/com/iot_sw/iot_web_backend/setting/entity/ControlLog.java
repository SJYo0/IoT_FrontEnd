package com.iot_sw.iot_web_backend.setting.entity;

import com.iot_sw.iot_web_backend.AiService.entity.AiAnalysis;
import com.iot_sw.iot_web_backend.Auth.entity.User; // 패키지 경로는 실제 환경에 맞게 수정
import com.iot_sw.iot_web_backend.device.entity.Device;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "control_log")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ControlLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "controlled_by")
    private User controlledBy; // 사용자가 수동 제어했을 경우

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ai_analysis_id")
    private AiAnalysis aiAnalysis; // AI가 제어했을 경우

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "longtext", nullable = false)
    private Map<String, Object> previousStatus;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "longtext", nullable = false)
    private Map<String, Object> newStatus;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}