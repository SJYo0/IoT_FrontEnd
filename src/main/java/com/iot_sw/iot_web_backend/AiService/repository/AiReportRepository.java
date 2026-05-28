package com.iot_sw.iot_web_backend.AiService.repository;

import com.iot_sw.iot_web_backend.AiService.entity.AiReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;
@Repository
public interface AiReportRepository extends JpaRepository<AiReport, Long> {
    Optional<AiReport> findTopByDevice_MacIdOrderByCreatedAtDesc(String macId);
    Optional<AiReport> findTopByOrderByCreatedAtDesc();
    Optional<AiReport> findTopByDevice_MacIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            String macId,
            LocalDateTime start,
            LocalDateTime end
    );
    Optional<AiReport> findTopByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    // 중복 생성 방지용: 기기별 오늘 날짜로 이미 생성된 보고서가 있는지 확인
    @Query("SELECT COUNT(r) > 0 FROM AiReport r WHERE r.device.id = :deviceId AND r.createdAt >= :start")
    boolean existsByDeviceIdAndCreatedAtAfter(
            @Param("deviceId") Long deviceId,
            @Param("start") LocalDateTime start
    );
}