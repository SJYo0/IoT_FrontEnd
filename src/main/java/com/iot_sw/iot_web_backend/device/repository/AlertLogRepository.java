package com.iot_sw.iot_web_backend.device.repository;

import com.iot_sw.iot_web_backend.device.entity.AlertLog;
import com.iot_sw.iot_web_backend.device.entity.Device;
import com.iot_sw.iot_web_backend.device.enums.AlertCategory;
import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AlertLogRepository extends JpaRepository<AlertLog, Long> {
    @Query("SELECT a FROM AlertLog a JOIN FETCH a.device d WHERE d.macId = :mac AND a.resolvedAt IS NULL ORDER BY a.createdAt DESC")
    List<AlertLog> findActiveAlertsByMac(@Param("mac") String mac);

    @Modifying
    @Query("UPDATE AlertLog a SET a.resolvedAt = :resolvedAt WHERE a.device = :device AND a.category = :category AND a.resolvedAt IS NULL")
    void resolveActiveAlertsByDevice(@Param("device") Device device, @Param("category") AlertCategory category, @Param("resolvedAt") LocalDateTime resolvedAt);

    @Query("SELECT a FROM AlertLog a WHERE a.device.id = :deviceId AND a.createdAt >= :start AND a.createdAt <= :end ORDER BY a.createdAt ASC")
    List<AlertLog> findDailyAlerts(@Param("deviceId") Long deviceId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
