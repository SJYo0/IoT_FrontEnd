package com.iot_sw.iot_web_backend.Auth.repository;

import com.iot_sw.iot_web_backend.Auth.entity.UserLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserLogRepository extends JpaRepository<UserLog, Long> {
    Optional<UserLog> findTopByUser_IdAndLogoutAtIsNullOrderByLoginAtDesc(Long userId);
}
