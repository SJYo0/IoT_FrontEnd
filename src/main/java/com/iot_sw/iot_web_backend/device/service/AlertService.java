package com.iot_sw.iot_web_backend.device.service;

import com.iot_sw.iot_web_backend.AiService.dto.request.AnalysisRequestDto;
import com.iot_sw.iot_web_backend.AiService.service.AnalysisService;
import com.iot_sw.iot_web_backend.dashboard.entity.WeatherData;
import com.iot_sw.iot_web_backend.dashboard.repository.WeatherRepository;
import com.iot_sw.iot_web_backend.device.component.DeviceIdCache;
import com.iot_sw.iot_web_backend.device.dto.request.SensorDataDTO;
import com.iot_sw.iot_web_backend.device.entity.AlertLog;
import com.iot_sw.iot_web_backend.device.entity.Device;
import com.iot_sw.iot_web_backend.device.enums.AlertCategory;
import com.iot_sw.iot_web_backend.device.enums.AlertSeverity;
import com.iot_sw.iot_web_backend.device.repository.AlertLogRepository;
import com.iot_sw.iot_web_backend.device.repository.DeviceRepository;
import com.iot_sw.iot_web_backend.mqtt.MqttGateway;
import com.iot_sw.iot_web_backend.setting.entity.ControlStatus;
import com.iot_sw.iot_web_backend.setting.entity.Environment;
import com.iot_sw.iot_web_backend.setting.repository.ControlStatusRepository;
import com.iot_sw.iot_web_backend.setting.repository.EnvironmentRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
@RequiredArgsConstructor
@Transactional
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
    private final DeviceIdCache deviceIdCache;
    private final DeviceRepository deviceRepository;

    private final AnalysisService analysisService;
    private final EnvironmentRepository environmentRepository;
    private final ControlStatusRepository controlStatusRepository;
    private final WeatherRepository weatherRepository;

    // 화재 감지
    public void checkFireDanger(String mac, SensorDataDTO dto) {
        if (dto.getFlameValue() == null) return;
        int flame = dto.getFlameValue();
        String currentSeverity = "NORMAL";
        String message = "화재 감지 해제.";

        if (flame < 300) { currentSeverity = "CRITICAL"; message = "화재 발생! 즉시 대피!"; }
        else if (flame < 500) { currentSeverity = "WARNING"; message = "화재 의심! 현장 확인 요망."; }

        processAlert(mac, "FIRE", currentSeverity, message, fireCountMap, fireSeverityMap, dto);
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

        processAlert(mac, "TEMP", currentSeverity, message, tempCountMap, tempSeverityMap, dto);
    }

    // 습도 감지
    public void checkHumidity(String mac, SensorDataDTO dto) {
        double hum = dto.getHumidity();
        String currentSeverity = "NORMAL";
        String message = "습도 정상 범위.";

        if (hum > 60 || hum < 40) {
            currentSeverity = "WARNING"; // 습도는 기획상 CRITICAL 없이 WARNING만 존재
            message = (hum > 60) ? "다습 주의! 장비 손상 위험." : "건조 주의! 화재 위험 주의.";
        }

        processAlert(mac, "HUMIDITY", currentSeverity, message, humCountMap, humSeverityMap, dto);
    }

    // TVOC 감지
    public void checkTvoc(String mac, SensorDataDTO dto) {
        if (dto.getTvoc() == null) return;
        int tvoc = dto.getTvoc();
        String currentSeverity = "NORMAL";
        String message = "화학물질 수치 안정화.";

        if (tvoc > 1000) { currentSeverity = "CRITICAL"; message = "유해 화학물질 매우 높음!"; }
        else if (tvoc > 500) { currentSeverity = "WARNING"; message = "화학물질 수치 주의."; }

        processAlert(mac, "TVOC", currentSeverity, message, tvocCountMap, tvocSeverityMap, dto);
    }

    // eCO2 감지
    public void checkEco2(String mac, SensorDataDTO dto) {
        if (dto.getEco2() == null) return;
        int eco2 = dto.getEco2();
        String currentSeverity = "NORMAL";
        String message = "이산화탄소 수치 정상화.";

        if (eco2 > 1500) { currentSeverity = "CRITICAL"; message = "이산화탄소 위험 수치! 즉시 환기 요망."; }
        else if (eco2 > 1000) { currentSeverity = "WARNING"; message = "이산화탄소 수치 높음. 환기 권장."; }

        processAlert(mac, "ECO2", currentSeverity, message, eco2CountMap, eco2SeverityMap, dto);
    }

    // 공통 알림 처리 로직
    private void processAlert(String mac, String category, String currentSeverity, String message,
                              ConcurrentHashMap<String, Integer> countMap,
                              ConcurrentHashMap<String, String> severityMap,
                              SensorDataDTO dto) {

        String previousSeverity = severityMap.getOrDefault(mac, "NORMAL");

        if (!currentSeverity.equals("NORMAL")) {
            int count = countMap.getOrDefault(mac, 0) + 1;
            countMap.put(mac, count);

            if (count >= DANGER_THRESHOLD) {
                if (!currentSeverity.equals(previousSeverity)) {
                    triggerAlarm(mac, category, currentSeverity, message, dto);
                    severityMap.put(mac, currentSeverity);
                }
                countMap.put(mac, 0); // 처리 후 카운트 초기화
            }
        } else {
            // 현재 수치가 정상이면 카운트 리셋
            if (countMap.getOrDefault(mac, 0) > 0) countMap.put(mac, 0);

            // 이전에 알람이 울린 적이 있었다면 정상 복귀 알림 전송
            if (!previousSeverity.equals("NORMAL")) {
                triggerAlarm(mac, category, "NORMAL", message, dto);
                severityMap.put(mac, "NORMAL");
            }
        }
    }

    // 알람 발생 (MQTT 발행 & DB 저장/업데이트)
    @Transactional
    protected void triggerAlarm(String macAddress, String categoryStr, String severityStr, String message, SensorDataDTO dto) {
        log.warn("[Alert] 기기: {}, 카테고리: {}, 등급: {}, 내용: {}", macAddress, categoryStr, severityStr, message);

        // 캐시에서 ID 찾기
        Long deviceId = deviceIdCache.getDeviceId(macAddress);
        if (deviceId == null) {
            log.warn("알람 저장 실패 - 미등록 기기: {}", macAddress);
            return;
        }

        // 프록시 객체 생성
        Device deviceProxy = deviceRepository.getReferenceById(deviceId);
        AlertCategory category = AlertCategory.valueOf(categoryStr);

        // MQTT 발행
        String alarmTopic = "webbackend/alarm/" + macAddress;
        String payload = String.format(
                "{\"category\":\"%s\", \"severity\":\"%s\", \"message\":\"%s\", \"timestamp\":%d}",
                categoryStr, severityStr, message, System.currentTimeMillis()
        );
        mqttGateway.sendToMqtt(payload, alarmTopic);

        // DB 저장

        if (severityStr.equals("NORMAL")) {
            alertLogRepository.resolveActiveAlertsByDevice(deviceProxy, category, LocalDateTime.now());
            log.info("[DB] 기기 {}의 {} 상황 종료", macAddress, categoryStr);
        } else {
            alertLogRepository.resolveActiveAlertsByDevice(deviceProxy, category, LocalDateTime.now());

            try {
                AlertLog alertLog = AlertLog.builder()
                        .device(deviceProxy)
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

        buildAndRequestAiAnalysis(deviceId, macAddress, categoryStr, severityStr, dto);
    }

    public void buildAndRequestAiAnalysis(Long deviceId, String macAddress, String category, String severity, SensorDataDTO sensorDto) {
        try {
            // 1. DB에서 기기 설치 유무(Setting) 및 현재 상태(Control) 조회
            Environment env = environmentRepository.findByDeviceId(deviceId).orElse(null);
            ControlStatus status = controlStatusRepository.findByDeviceId(deviceId).orElse(null);

            if (env == null || status == null) {
                log.warn("[AI] 기기 {}의 환경/상태 데이터가 없어 AI 분석을 스킵합니다.", deviceId);
                return;
            }

            // 2. 🌟 최신 날씨 데이터(Outdoor) 조회
            WeatherData weather = weatherRepository.findTopByOrderByCreatedAtDesc().orElse(null);
            AnalysisRequestDto.Outdoor outdoorDto;

            if (weather != null) {
                outdoorDto = AnalysisRequestDto.Outdoor.builder()
                        .ta(weather.getTempTa())
                        .wd(weather.getWindDirWd())
                        .ws(weather.getWindSpeedWs())
                        .hm(weather.getHumidityHm())
                        .rn(weather.getPrecipitationRn())
                        // Byte 타입(1=True, 0=False)을 Boolean으로 안전하게 변환
                        .isSW(weather.getIsStrongWindWarning() != null && weather.getIsStrongWindWarning() > 0)
                        .isDW(weather.getIsDryWarning() != null && weather.getIsDryWarning() > 0)
                        .build();
            } else {
                log.warn("[AI] 최신 날씨 데이터를 찾을 수 없어 기본값(null)으로 진행합니다.");
                outdoorDto = AnalysisRequestDto.Outdoor.builder().build(); // 빈 객체 할당
            }

            // 3. DTO 조립
            AnalysisRequestDto requestDto = AnalysisRequestDto.builder()
                    .macAddress(macAddress)
                    .indoor(AnalysisRequestDto.Indoor.builder()
                            .temperature(sensorDto.getTemperature())
                            .humidity(sensorDto.getHumidity())
                            .pressure(sensorDto.getPressure())
                            .tvoc(sensorDto.getTvoc())
                            .eco2(sensorDto.getEco2())
                            .flame(sensorDto.getFlameValue())
                            .build())
                    .outdoor(outdoorDto) // 🌟 조립된 날씨 객체 주입
                    .setting(AnalysisRequestDto.Setting.builder()
                            .north_window(env.getNorthWindow())
                            .south_window(env.getSouthWindow())
                            .east_window(env.getEastWindow())
                            .west_window(env.getWestWindow())
                            .air_conditioner(env.getAirConditioner())
                            .heating(env.getHeating())
                            .humidifier(env.getHumidifier())
                            .dehumidifier(env.getDehumidifier())
                            .air_cleaner(env.getAirCleaner())
                            .sprinkler(env.getSprinkler())
                            .fire_alarm(env.getFireAlarm())
                            .build())
                    .control(AnalysisRequestDto.Control.builder()
                            .north_window(status.getNorthWindow())
                            .south_window(status.getSouthWindow())
                            .east_window(status.getEastWindow())
                            .west_window(status.getWestWindow())
                            .air_conditioner(status.getAirConditioner())
                            .heating(status.getHeating())
                            .humidifier(status.getHumidifier())
                            .dehumidifier(status.getDehumidifier())
                            .air_cleaner(status.getAirCleaner())
                            .sprinkler(status.getSprinkler())
                            .fire_alarm(status.getFireAlarm())
                            .build())
                    .alert(AnalysisRequestDto.Alert.builder()
                            .category(category)
                            .severity(severity)
                            .build())
                    .build();

            // 4. AnalysisService로 AI 요청 던지기
            analysisService.requestAiAnalysis(deviceId, requestDto);

        } catch (Exception e) {
            log.error("[AI] DTO 조립 중 오류 발생: {}", e.getMessage(), e);
        }
    }
}