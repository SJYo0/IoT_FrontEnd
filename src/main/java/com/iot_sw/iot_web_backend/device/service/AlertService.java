package com.iot_sw.iot_web_backend.device.service;

import com.iot_sw.iot_web_backend.device.dto.request.SensorDataDTO;
import com.iot_sw.iot_web_backend.device.entity.AlertLog;
import com.iot_sw.iot_web_backend.device.enums.AlertCategory;
import com.iot_sw.iot_web_backend.device.enums.AlertSeverity;
import com.iot_sw.iot_web_backend.device.repository.AlertLogRepository;
import com.iot_sw.iot_web_backend.mqtt.MqttGateway;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
public class AlertService {
    // 연속 감지 카운터
    private final ConcurrentHashMap<String, Integer> fireCountMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Integer> tempCountMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Integer> humCountMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Integer> tvocCountMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Integer> eco2CountMap = new ConcurrentHashMap<>();

    // 기기의 현재 상태를 저장
    private final ConcurrentHashMap<String, String> fireSeverityMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> tempSeverityMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> humSeverityMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> tvocSeverityMap = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, String> eco2SeverityMap = new ConcurrentHashMap<>();

    private static final int DANGER_THRESHOLD = 3; // 3초 연속 감지 시 알람

    private final MqttGateway mqttGateway;
    private final AlertLogRepository alertLogRepository;

    // 화재 감지
    public void checkFireDanger(String mac, SensorDataDTO dto) {
        if (dto.getFlameValue() == null) return;
        int flame = dto.getFlameValue();
        String currentSeverity = "NORMAL";
        String message = "화재 감지 해제.";

        if (flame < 300) { currentSeverity = "CRITICAL"; message = "화재 발생! 즉시 대피!"; }
        else if (flame < 500) { currentSeverity = "WARNING"; message = "화재 의심! 현장 확인 요망."; }

        processAlert(mac, "FIRE", currentSeverity, message, fireCountMap, fireSeverityMap);
    }

    // 온도 감지
    public void checkTemperature(String mac, SensorDataDTO dto) {
        double temp = dto.getTemperature();
        String currentSeverity = "NORMAL";
        String message = "온도 정상 범위.";

        if (temp > 40 || temp < 5) {
            currentSeverity = "CRITICAL";
            message = (temp > 40) ? "폭염 주의! 장비 과열 위험." : "동파 위험! 장비 손상 위험.";
        } else if (temp > 30 || temp < 15) {
            currentSeverity = "WARNING";
            message = (temp > 30) ? "실내 온도 높음." : "실내 온도 낮음.";
        }

        processAlert(mac, "TEMP", currentSeverity, message, tempCountMap, tempSeverityMap);
    }

    // 습도 감지
    public void checkHumidity(String mac, SensorDataDTO dto) {
        double hum = dto.getHumidity();
        String currentSeverity = "NORMAL";
        String message = "습도 정상 범위.";

        if (hum > 70 || hum < 30) {
            currentSeverity = "WARNING"; // 습도는 기획상 CRITICAL 없이 WARNING만 존재
            message = (hum > 70) ? "다습 주의! 장비 손상 위험." : "건조 주의! 화재 위험 주의.";
        }

        processAlert(mac, "HUMIDITY", currentSeverity, message, humCountMap, humSeverityMap);
    }

    // TVOC 감지
    public void checkTvoc(String mac, SensorDataDTO dto) {
        if (dto.getTvoc() == null) return;
        int tvoc = dto.getTvoc();
        String currentSeverity = "NORMAL";
        String message = "화학물질 수치 안정화.";

        if (tvoc > 1000) { currentSeverity = "CRITICAL"; message = "유해 화학물질 매우 높음!"; }
        else if (tvoc > 500) { currentSeverity = "WARNING"; message = "화학물질 수치 주의."; }

        processAlert(mac, "TVOC", currentSeverity, message, tvocCountMap, tvocSeverityMap);
    }

    // eCO2 감지
    public void checkEco2(String mac, SensorDataDTO dto) {
        if (dto.getEco2() == null) return;
        int eco2 = dto.getEco2();
        String currentSeverity = "NORMAL";
        String message = "이산화탄소 수치 정상화.";

        if (eco2 > 1500) { currentSeverity = "CRITICAL"; message = "이산화탄소 위험 수치! 즉시 환기 요망."; }
        else if (eco2 > 1000) { currentSeverity = "WARNING"; message = "이산화탄소 수치 높음. 환기 권장."; }

        processAlert(mac, "ECO2", currentSeverity, message, eco2CountMap, eco2SeverityMap);
    }

    // 공통 알림 처리 로직
    private void processAlert(String mac, String category, String currentSeverity, String message,
                              ConcurrentHashMap<String, Integer> countMap,
                              ConcurrentHashMap<String, String> severityMap) {

        String previousSeverity = severityMap.getOrDefault(mac, "NORMAL");

        if (!currentSeverity.equals("NORMAL")) {
            int count = countMap.getOrDefault(mac, 0) + 1;
            countMap.put(mac, count);

            if (count >= DANGER_THRESHOLD) {
                if (!currentSeverity.equals(previousSeverity)) {
                    triggerAlarm(mac, category, currentSeverity, message);
                    severityMap.put(mac, currentSeverity);
                }
                countMap.put(mac, 0); // 처리 후 카운트 초기화
            }
        } else {
            // 현재 수치가 정상이면 카운트 리셋
            if (countMap.getOrDefault(mac, 0) > 0) countMap.put(mac, 0);

            // 이전에 알람이 울린 적이 있었다면 정상 복귀 알림 전송
            if (!previousSeverity.equals("NORMAL")) {
                triggerAlarm(mac, category, "NORMAL", message);
                severityMap.put(mac, "NORMAL");
            }
        }
    }

    // 알람 발생 (MQTT 발행 & DB 저장/업데이트)
    @Transactional
    protected void triggerAlarm(String macAddress, String categoryStr, String severityStr, String message) {
        log.warn("[Alert] 기기: {}, 카테고리: {}, 등급: {}, 내용: {}", macAddress, categoryStr, severityStr, message);

        // MQTT 발행
        String alarmTopic = "webbackend/alarm/" + macAddress;
        String payload = String.format(
                "{\"category\":\"%s\", \"severity\":\"%s\", \"message\":\"%s\", \"timestamp\":%d}",
                categoryStr, severityStr, message, System.currentTimeMillis()
        );
        mqttGateway.sendToMqtt(payload, alarmTopic);

        // DB 저장
        AlertCategory category = AlertCategory.valueOf(categoryStr);

        if (severityStr.equals("NORMAL")) {
            alertLogRepository.resolveActiveAlerts(macAddress, category, LocalDateTime.now());
            log.info("[DB] 기기 {}의 {} 상황 종료", macAddress, categoryStr);
        } else {
            alertLogRepository.resolveActiveAlerts(macAddress, category, LocalDateTime.now());

            try {
                AlertLog alertLog = AlertLog.builder()
                        .macAddress(macAddress)
                        .category(category)
                        .severity(AlertSeverity.valueOf(severityStr))
                        .message(message)
                        .createdAt(LocalDateTime.now())
                        .build();

                alertLogRepository.save(alertLog);
                log.info("[DB] 알림 저장완료 (ID: {})", alertLog.getId());

            } catch (IllegalArgumentException e) {
                log.error("[DB] 오류발생: {}", e.getMessage());
            }
        }
    }
}