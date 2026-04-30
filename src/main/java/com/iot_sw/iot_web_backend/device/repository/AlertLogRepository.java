package com.iot_sw.iot_web_backend.device.repository;

import com.iot_sw.iot_web_backend.device.entity.AlertLog;
import com.iot_sw.iot_web_backend.device.enums.AlertCategory;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AlertLogRepository extends JpaRepository<AlertLog, Long> {
    @Transactional
    @Modifying(clearAutomatically = true)
    // 💡 변경점: CURRENT_TIMESTAMP 대신 :resolveTime 파라미터를 사용합니다.
    @Query("UPDATE AlertLog a SET a.resolvedAt = :resolveTime WHERE a.macAddress = :mac AND a.category = :category AND a.resolvedAt IS NULL")
    void resolveActiveAlerts(@Param("mac") String mac,
                             @Param("category") AlertCategory category,
                             @Param("resolveTime") LocalDateTime resolveTime); // 💡 파라미터 추가

    // 해결되지 않은(현재 진행 중인) 특정 기기의 알람 목록 조회
    @Query("SELECT a FROM AlertLog a WHERE a.macAddress = :mac AND a.resolvedAt IS NULL")
    List<AlertLog> findActiveAlertsByMac(@Param("mac") String mac);
}
