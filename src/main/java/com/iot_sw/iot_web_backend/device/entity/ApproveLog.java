package com.iot_sw.iot_web_backend.device.entity;

import com.iot_sw.iot_web_backend.Auth.entity.User;
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
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "approve_log")
@EntityListeners(AuditingEntityListener.class)
public class ApproveLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(name = "is_approve", nullable = false)
    private Boolean isApprove;

    @CreatedDate
    @Column(name = "approved_at", nullable = false, updatable = false)
    private LocalDateTime approvedAt;

    // 승인 처리 로직
    @Builder
    public ApproveLog(User user, Device device, Boolean isApprove) {
        this.user = user;
        this.device = device;
        this.isApprove = isApprove;
    }
}
