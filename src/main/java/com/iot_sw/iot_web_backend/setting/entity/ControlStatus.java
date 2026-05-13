package com.iot_sw.iot_web_backend.setting.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.iot_sw.iot_web_backend.device.entity.Device;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "control_status")
@Getter
@Setter // 상태 업데이트를 위해 Setter 허용
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class ControlStatus {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Device와 1:1 관계 (UNIQUE)
    @JsonIgnore
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", unique = true, nullable = false)
    private Device device;

    private Boolean northWindow;
    private Boolean southWindow;
    private Boolean eastWindow;
    private Boolean westWindow;
    private Boolean airConditioner;
    private Boolean heating;
    private Boolean humidifier;
    private Boolean dehumidifier;
    private Boolean airCleaner;
    private Boolean sprinkler;
    private Boolean fireAlarm;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}