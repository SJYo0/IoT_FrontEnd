package com.iot_sw.iot_web_backend.setting.repository;

import com.iot_sw.iot_web_backend.setting.entity.ControlLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface ControlLogRepository extends JpaRepository<ControlLog, Long> {
    List<ControlLog> findByDeviceIdOrderByCreatedAtDesc(Long deviceId);

    // ControlLogRepository.java 에 추가
    @Query("SELECT c FROM ControlLog c WHERE c.device.id = :deviceId AND c.createdAt >= :start AND c.createdAt <= :end ORDER BY c.createdAt ASC")
    List<ControlLog> findDailyLogs(@Param("deviceId") Long deviceId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
