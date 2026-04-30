package com.iot_sw.iot_web_backend.device.service;

import com.iot_sw.iot_web_backend.device.dto.request.RegisterRequestDTO;
import com.iot_sw.iot_web_backend.device.dto.request.SensorDataDTO;
import com.iot_sw.iot_web_backend.device.dto.request.TurnOffRequestDTO;
import com.iot_sw.iot_web_backend.device.entity.SensorTelemetry;
import com.iot_sw.iot_web_backend.device.repository.SensorRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.integration.annotation.ServiceActivator;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.integration.mqtt.support.MqttHeaders;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class DeviceMqttService {

    private final DeviceService deviceService;
    private final SensorRepository sensorRepository;
    private final ObjectMapper objectMapper;
    private final AlertService alertService;

    private final List<SensorTelemetry> buffer = Collections.synchronizedList(new ArrayList<>()); // 안전 큐 느낌

    // 구독 채널에 들어온 메시지를 처리
    @ServiceActivator(inputChannel = "mqttInboundChannel")
    public void handleMessage(String payload, @Header(MqttHeaders.RECEIVED_TOPIC) String topic) {
        log.info("MQTT 수신 - 토픽: {}, 내용: {}", topic, payload);

        try {
            if (topic.equals("provisioning/request")) {
                JsonNode json = objectMapper.readTree(payload);

                //String macId = json.get("mac_address").asString();
                //String location = json.has("location") ? json.get("location").asString() : "위치 미지정";
                //String ipAddress = json.has("ip_address") ? json.get("ip_address").asString() : "0.0.0.0";

                // 서비스에 동작 위임
                deviceService.registerPendingDevice(RegisterRequestDTO.builder()
                                                    .macId(json.get("mac_address").asText())
                                                    .ipAddress(json.has("ip_address") ? json.get("ip_address").asText() : "0.0.0.0")
                                                    .build());
            }
            else if (topic.equals("devices/status")) {
                JsonNode json = objectMapper.readTree(payload);

                log.info("[MQTT] 게이트웨이 비정상 종료 감지");

                if(json.get("status").asText().equals("OFFLINE")) {
                    deviceService.turnOffDevice(TurnOffRequestDTO.builder()
                            .macId(json.get("mac_address").asText())
                            .status(json.get("status").asText())
                            .build());
                }
            }
            else if (topic.startsWith("gateway/") && topic.endsWith("/telemetry")) {

                String[] topicParts = topic.split("/");
                if (topicParts.length == 3) {
                    String macAddress = topicParts[1];

                    SensorDataDTO dto = objectMapper.readValue(payload, SensorDataDTO.class);

                    log.info("[센서 수신] MAC: {}, 온도: {}C, TVOC: {}", macAddress, dto.getTemperature(), dto.getTvoc());

                    // DB 배치 인서트 로직
                    SensorTelemetry entity = SensorTelemetry.builder()
                            .macAddress(macAddress)
                            .measuredAt(dto.getMeasuredAt()) // 날짜 자료형 변환
                            .temperature(BigDecimal.valueOf(dto.getTemperature()))
                            .humidity(BigDecimal.valueOf(dto.getHumidity()))
                            .pressure(BigDecimal.valueOf(dto.getPressure()))
                            .tvoc(dto.getTvoc())
                            .eco2(dto.getEco2())
                            .flameValue(dto.getFlameValue())
                            .build();

                    buffer.add(entity);

                    // 센서 데이터 60개 이상 쌓이면 바로 인서트
                    if (buffer.size() >= 60) {
                        flushBuffer();
                    }

                    // 4. TODO: 비정상 데이터(화재 감지 등) 실시간 알람 로직
                    // if (sensorData.getFlameValue() < 500) { alertService.triggerFireAlarm(macAddress); }
                    alertService.checkFireDanger(macAddress, dto);
                    alertService.checkTemperature(macAddress, dto);
                    alertService.checkHumidity(macAddress, dto);
                    alertService.checkTvoc(macAddress, dto);
                    alertService.checkEco2(macAddress, dto);

                }
            }
        } catch (Exception e) {
            log.error("MQTT 파싱/처리 중 오류: {}", e.getMessage());
        }
    }

    // 1분마다 자동 배치 인서트 동작
    @Scheduled(fixedRate = 60000)
    @Transactional
    public void flushBuffer() {
        if (buffer.isEmpty()) return;

        // 버퍼 복사
        List<SensorTelemetry> toSave;
        synchronized (buffer) {
            toSave = new ArrayList<>(buffer);
            buffer.clear();
        }

        try {
            log.info("[DB] {}개의 데이터를 MariaDB에 배치 인서트 시작", toSave.size());
            sensorRepository.saveAll(toSave);
            log.info("[DB] 배치 인서트 성공.");
        } catch (Exception e) {
            log.error("[DB] 배치 인서트 실패: {}", e.getMessage());
        }
    }
}