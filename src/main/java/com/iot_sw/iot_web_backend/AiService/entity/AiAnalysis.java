package com.iot_sw.iot_web_backend.AiService.entity;

import com.iot_sw.iot_web_backend.device.entity.Device;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "ai_analysis")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class AiAnalysis {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "longtext", nullable = false)
    private Map<String, Object> analysis;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "longtext", nullable = false)
    private Map<String, Object> inputData;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
