package com.iot_sw.iot_web_backend.Auth.repository;

import com.iot_sw.iot_web_backend.Auth.entity.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {
    Optional<PasswordResetToken> findTopByUser_UsernameAndResetCodeAndUsedFalseOrderByCreatedAtDesc(
            String username,
            String resetCode
    );

    long deleteByExpiresAtBeforeOrUsedTrue(LocalDateTime expiresAt);
}
