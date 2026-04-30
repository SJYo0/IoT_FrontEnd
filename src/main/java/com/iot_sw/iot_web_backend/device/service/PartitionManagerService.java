package com.iot_sw.iot_web_backend.device.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class PartitionManagerService {
    private final JdbcTemplate jdbcTemplate;

    // 서버 구동 시 최초 1회 실행
    @EventListener(ApplicationReadyEvent.class)
    public void initPartition() {
        log.info("[DB] 시스템 초기 파티션 체크 시작...");
        createPartitionForDate(LocalDate.now()); // 오늘자 파티션
        createPartitionForDate(LocalDate.now().plusDays(1)); // 내일자 파티션 (안전빵)
    }

    private void createPartitionForDate(LocalDate date) {
        String partitionName = "p_" + date.format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String lessThanValue = date.plusDays(1).format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + " 00:00:00";

        try {
            // p_max를 쪼개서 해당 날짜 파티션 생성
            String sql = String.format(
                    "ALTER TABLE sensor_telemetry REORGANIZE PARTITION p_max INTO (" +
                            "PARTITION %s VALUES LESS THAN ('%s'), " +
                            "PARTITION p_max VALUES LESS THAN (MAXVALUE))",
                    partitionName, lessThanValue
            );
            jdbcTemplate.execute(sql);
            log.info("[DB] 파티션 생성 성공: {}", partitionName);
        } catch (Exception e) {
            log.debug("[DB] 파티션이 이미 존재합니다: {}", partitionName);
        }
    }

    // 매일 새벽 1시에 실행
    @Scheduled(cron = "0 0 1 * * ?")
    public void managePartitions() {
        createFuturePartition();
        dropOldPartition(30); // 30일 지난 데이터 삭제
    }

    private void createFuturePartition() {
        LocalDate targetDate = LocalDate.now().plusDays(2);
        String partitionName = "p_" + targetDate.minusDays(1).format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String lessThanValue = targetDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd")) + " 00:00:00";

        try {
            String sql = String.format(
                    "ALTER TABLE sensor_telemetry REORGANIZE PARTITION p_max INTO (" +
                            "PARTITION %s VALUES LESS THAN ('%s'), " +
                            "PARTITION p_max VALUES LESS THAN (MAXVALUE))",
                    partitionName, lessThanValue
            );
            jdbcTemplate.execute(sql);
            log.info("[DB] 새로운 파티션 생성 완료: {}", partitionName);
        } catch (Exception e) {
            log.warn("[DB] 파티션 생성 건너뜀");
        }
    }

    private void dropOldPartition(int daysAgo) {
        LocalDate deleteTargetDate = LocalDate.now().minusDays(daysAgo);
        String partitionName = "p_" + deleteTargetDate.format(DateTimeFormatter.ofPattern("yyyyMMdd"));

        try {
            // 파티션 존재 여부 확인 후 드랍
            String sql = "ALTER TABLE sensor_telemetry DROP PARTITION " + partitionName;
            jdbcTemplate.execute(sql);
            log.info("[DB] 오래된 파티션 삭제 완료: {}", partitionName);
        } catch (Exception e) {
            log.error("[DB] 파티션 삭제 실패: {}", partitionName);
        }
    }
}
