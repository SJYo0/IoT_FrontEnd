package com.iot_sw.iot_web_backend.device.entity;

import com.iot_sw.iot_web_backend.device.enums.DeviceStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter
@Setter
public class Device {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name; // 관리자가 부여할 이름

    @Column(length = 100)
    private String location; // 설치 위치

    @Column(length = 15)
    private String ipAddress; // 기기 연결 IP

    @Column(name = "mac_id", unique = true, nullable = false, length = 20)
    private String macId; // 기기 MAC 주소

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private DeviceStatus status = DeviceStatus.PENDING; // 기기 연결 상태

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt; // 최초 등록 시각

    @UpdateTimestamp
    private LocalDateTime updatedAt; // 기기 정보 수정 시각

    public void approve(String name, String location) {
        this.name = name;
        this.location = location;
        this.status = DeviceStatus.ONLINE;
    }

    public void reject() {
        this.status = DeviceStatus.REJECTED;
    }

    public void turnOff() {
        this.status = DeviceStatus.OFFLINE;
    }
}

