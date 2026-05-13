package com.iot_sw.iot_web_backend.AiService.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.iot_sw.iot_web_backend.AiService.dto.request.AnalysisRequestDto;
import com.iot_sw.iot_web_backend.AiService.dto.response.AnalysisResponseDto;
import com.iot_sw.iot_web_backend.AiService.entity.AiAnalysis;
import com.iot_sw.iot_web_backend.setting.entity.ControlLog;
import com.iot_sw.iot_web_backend.setting.entity.ControlStatus;
import com.iot_sw.iot_web_backend.device.entity.Device;
import com.iot_sw.iot_web_backend.AiService.repository.AiAnalysisRepository;
import com.iot_sw.iot_web_backend.setting.repository.ControlLogRepository;
import com.iot_sw.iot_web_backend.setting.repository.ControlStatusRepository;
import com.iot_sw.iot_web_backend.device.repository.DeviceRepository;
import com.iot_sw.iot_web_backend.mqtt.MqttGateway;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AnalysisService {

    private final WebClient webClient = WebClient.builder().baseUrl("http://localhost:8000").build();
    private final ObjectMapper objectMapper;

    private final DeviceRepository deviceRepository;
    private final AiAnalysisRepository aiAnalysisRepository;
    private final ControlStatusRepository controlStatusRepository;
    private final ControlLogRepository controlLogRepository;
    private final MqttGateway mqttGateway;

    // AI 분석 및 제어 명령
    public void requestAiAnalysis(Long deviceId, AnalysisRequestDto requestDto) {
        log.info("[AI] 분석 요청 시작 - 기기 ID: {}", deviceId);

        webClient.post()
                .uri("/api/v1/analyze")
                .contentType(MediaType.APPLICATION_JSON)
                .bodyValue(requestDto) // 센서, 날씨, 환경, 상태 정보가 담긴 Map
                .retrieve()
                .bodyToMono(AnalysisResponseDto.class) // AI 서버 응답을 Map으로 변환
                .subscribe(
                        response -> handleAiResponse(deviceId, requestDto, response),
                        error -> log.error("[AI] 통신 에러: {}", error.getMessage())
                );

        // .subscribe()를 호출하자마자 이 메서드는 즉시 종료됩니다. (Non-blocking)
    }

    // AI 제어로직 이벤트 핸들
    @Transactional
    protected void handleAiResponse(Long deviceId, AnalysisRequestDto requestDto, AnalysisResponseDto aiResult) {
        try {
            Device deviceProxy = deviceRepository.getReferenceById(deviceId);

            // 1. AI 분석 결과 저장 (AiAnalysis)
            Map<String, Object> inputDataMap = objectMapper.convertValue(requestDto, Map.class);
            Map<String, Object> analysisMap = objectMapper.convertValue(aiResult, Map.class);

            AiAnalysis analysis = AiAnalysis.builder()
                    .device(deviceProxy)
                    .inputData(inputDataMap)
                    .analysis(analysisMap)
                    .createdAt(LocalDateTime.now())
                    .build();
            aiAnalysisRepository.save(analysis);

            // =========================================================
            // 2-1. MQTT 발행 (1): Analysis (Status + Summary)
            // 프론트엔드 대시보드 리포트 업데이트용
            // =========================================================
            Map<String, Object> analysisPayloadMap = new HashMap<>();
            analysisPayloadMap.put("status", aiResult.getStatus());
            analysisPayloadMap.put("summary", aiResult.getSummary());

            String analysisPayload = objectMapper.writeValueAsString(analysisPayloadMap);
            String analysisTopic = "webbackend/analysis/" + aiResult.getMacAddress();
            mqttGateway.sendToMqtt(analysisPayload, analysisTopic);
            log.info("[AI -> MQTT] 분석 결과(리포트) 전송 완료: {}", analysisTopic);

            // =========================================================
            // 2-2. MQTT 발행 (2): Control
            // 실제 기기 제어 및 프론트엔드 스위치 상태 업데이트용
            // =========================================================
            AnalysisResponseDto.Control controlDto = aiResult.getControl();
            String controlPayload = objectMapper.writeValueAsString(controlDto);

            if (!"{}".equals(controlPayload)) {
                String controlTopic = "webbackend/control/" + aiResult.getMacAddress();
                mqttGateway.sendToMqtt(controlPayload, controlTopic);
                log.info("[AI -> MQTT] 제어 명령 전송 완료: {}", controlTopic);

                // 3. ControlStatus DB 업데이트 및 ControlLog 히스토리 저장
                updateControlAndLog(deviceProxy, analysis, controlDto);
            } else {
                log.info("[AI] 제어할 기기가 없어 Control MQTT 명령을 전송하지 않습니다.");
            }

        } catch (Exception e) {
            log.error("[AI] 응답 처리 중 오류 발생: {}", e.getMessage());
        }
    }

    // 제어 명령 히스토리 기록
    private void updateControlAndLog(Device device, AiAnalysis analysis, AnalysisResponseDto.Control newControlDto) {
        // 현재 상태 조회
        ControlStatus currentStatus = controlStatusRepository.findByDeviceId(device.getId())
                .orElseThrow(() -> new RuntimeException("제어 상태 테이블이 없습니다."));

        // 로그 기록을 위한 이전 상태 복사 (Deep Copy)
        Map<String, Object> previousStatus = objectMapper.convertValue(currentStatus, Map.class);

        Map<String, Object> newStatusMap = objectMapper.convertValue(newControlDto, Map.class);

        // 신규 상태 반영 (Reflection 등을 쓰거나 직접 매핑)
        if (newControlDto.getNorth_window() != null) currentStatus.setNorthWindow(newControlDto.getNorth_window());
        if (newControlDto.getSouth_window() != null) currentStatus.setSouthWindow(newControlDto.getSouth_window());
        if (newControlDto.getEast_window() != null) currentStatus.setEastWindow(newControlDto.getEast_window());
        if (newControlDto.getWest_window() != null) currentStatus.setWestWindow(newControlDto.getWest_window());
        if (newControlDto.getAir_conditioner() != null) currentStatus.setAirConditioner(newControlDto.getAir_conditioner());
        if (newControlDto.getHeating() != null) currentStatus.setHeating(newControlDto.getHeating());
        if (newControlDto.getHumidifier() != null) currentStatus.setHumidifier(newControlDto.getHumidifier());
        if (newControlDto.getDehumidifier() != null) currentStatus.setDehumidifier(newControlDto.getDehumidifier());
        if (newControlDto.getAir_cleaner() != null) currentStatus.setAirCleaner(newControlDto.getAir_cleaner());
        if (newControlDto.getSprinkler() != null) currentStatus.setSprinkler(newControlDto.getSprinkler());
        if (newControlDto.getFire_alarm() != null) currentStatus.setFireAlarm(newControlDto.getFire_alarm());

        controlStatusRepository.save(currentStatus);

        // ControlLog 저장
        ControlLog logEntity = ControlLog.builder()
                .device(device)
                .aiAnalysis(analysis)
                .previousStatus(previousStatus)
                .newStatus(newStatusMap)
                .createdAt(LocalDateTime.now())
                .build();
        controlLogRepository.save(logEntity);
    }
}
