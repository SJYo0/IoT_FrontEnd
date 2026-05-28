package com.iot_sw.iot_web_backend.AiService.controller;

import com.iot_sw.iot_web_backend.AiService.dto.request.AnalysisRequestDto;
import com.iot_sw.iot_web_backend.AiService.entity.AiAnalysis;
import com.iot_sw.iot_web_backend.AiService.entity.AiReport;
import com.iot_sw.iot_web_backend.AiService.repository.AiAnalysisRepository;
import com.iot_sw.iot_web_backend.AiService.repository.AiReportRepository;
import com.iot_sw.iot_web_backend.AiService.service.AnalysisService;
import com.iot_sw.iot_web_backend.dashboard.entity.WeatherData;
import com.iot_sw.iot_web_backend.dashboard.repository.WeatherRepository;
import com.iot_sw.iot_web_backend.device.entity.SensorTelemetry;
import com.iot_sw.iot_web_backend.device.repository.DeviceRepository;
import com.iot_sw.iot_web_backend.device.repository.SensorRepository;
import com.iot_sw.iot_web_backend.setting.entity.ControlStatus;
import com.iot_sw.iot_web_backend.setting.entity.Environment;
import com.iot_sw.iot_web_backend.setting.repository.ControlStatusRepository;
import com.iot_sw.iot_web_backend.setting.repository.EnvironmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AnalysisController {
    private final AnalysisService analysisService;
    private final AiAnalysisRepository aiAnalysisRepository;
    private final AiReportRepository aiReportRepository;
    private final DeviceRepository deviceRepository;
    private final SensorRepository sensorRepository;
    private final WeatherRepository weatherRepository;
    private final EnvironmentRepository environmentRepository;
    private final ControlStatusRepository controlStatusRepository;

    @GetMapping("/latest")
    public ResponseEntity<Map<String, Object>> latest(@RequestParam(required = false) String mac) {
        Optional<AiAnalysis> latest = (mac != null && !mac.isBlank())
                ? aiAnalysisRepository.findTopByDevice_MacIdOrderByCreatedAtDesc(mac.trim())
                : aiAnalysisRepository.findTopByOrderByCreatedAtDesc();

        if (latest.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        AiAnalysis analysis = latest.get();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("macAddress", analysis.getDevice().getMacId());
        response.put("status", analysis.getAnalysis().get("status"));
        response.put("summary", analysis.getAnalysis().get("summary"));
        response.put("createdAt", analysis.getCreatedAt());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/report/latest")
    public ResponseEntity<Map<String, Object>> latestReport(@RequestParam(required = false) String mac) {
        Optional<AiReport> latest = (mac != null && !mac.isBlank())
                ? aiReportRepository.findTopByDevice_MacIdOrderByCreatedAtDesc(mac.trim())
                : aiReportRepository.findTopByOrderByCreatedAtDesc();

        if (latest.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        AiReport report = latest.get();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("macAddress", report.getDevice().getMacId());
        response.put("result", report.getResult());
        response.put("createdAt", report.getCreatedAt());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/report/daily")
    public ResponseEntity<Map<String, Object>> dailyReport(
            @RequestParam(required = false) String mac,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        LocalDateTime start = date.atStartOfDay();
        LocalDateTime end = date.plusDays(1).atStartOfDay();

        Optional<AiReport> daily = (mac != null && !mac.isBlank())
                ? aiReportRepository.findTopByDevice_MacIdAndCreatedAtBetweenOrderByCreatedAtDesc(mac.trim(), start, end)
                : aiReportRepository.findTopByCreatedAtBetweenOrderByCreatedAtDesc(start, end);

        if (daily.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        AiReport report = daily.get();
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("macAddress", report.getDevice().getMacId());
        response.put("result", report.getResult());
        response.put("createdAt", report.getCreatedAt());
        response.put("reportDate", date.toString());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/reanalyze")
    public ResponseEntity<Map<String, Object>> reanalyze(@RequestParam String mac) {
        String normalizedMac = mac == null ? "" : mac.trim();
        if (normalizedMac.isBlank()) {
            return ResponseEntity.badRequest().body(messageBody("mac 파라미터가 필요합니다."));
        }

        return deviceRepository.findByMacId(normalizedMac)
                .map(device -> {
                    Long deviceId = device.getId();

                    Optional<SensorTelemetry> latestSensorOpt = sensorRepository.findTopByDevice_MacIdOrderByMeasuredAtDesc(normalizedMac);
                    Optional<WeatherData> latestWeatherOpt = weatherRepository.findTopByOrderByCreatedAtDesc();
                    Optional<Environment> envOpt = environmentRepository.findByDeviceId(deviceId);
                    Optional<ControlStatus> controlOpt = controlStatusRepository.findByDeviceId(deviceId);

                    if (latestSensorOpt.isEmpty() || envOpt.isEmpty() || controlOpt.isEmpty()) {
                        return ResponseEntity.badRequest().body(messageBody("재분석에 필요한 센서/환경/제어 데이터가 부족합니다."));
                    }

                    AnalysisRequestDto requestDto = buildRequest(
                            normalizedMac,
                            latestSensorOpt.get(),
                            latestWeatherOpt.orElse(null),
                            envOpt.get(),
                            controlOpt.get()
                    );

                    analysisService.requestAiAnalysis(deviceId, requestDto);
                    Map<String, Object> body = new LinkedHashMap<>();
                    body.put("message", "재분석 요청을 접수했습니다.");
                    body.put("macAddress", normalizedMac);
                    body.put("requestedAt", LocalDateTime.now().toString());
                    return ResponseEntity.accepted().body(body);
                })
                .orElseGet(() -> ResponseEntity.badRequest().body(messageBody("등록되지 않은 MAC 주소입니다.")));
    }

    private AnalysisRequestDto buildRequest(
            String mac,
            SensorTelemetry sensor,
            WeatherData weather,
            Environment env,
            ControlStatus control
    ) {
        boolean tempRelatedEnabled =
                isEnabled(control.getAirConditioner()) ||
                isEnabled(control.getHeating()) ||
                isEnabled(control.getNorthWindow()) ||
                isEnabled(control.getSouthWindow()) ||
                isEnabled(control.getEastWindow()) ||
                isEnabled(control.getWestWindow());
        boolean humidityRelatedEnabled =
                isEnabled(control.getHumidifier()) ||
                isEnabled(control.getDehumidifier());
        boolean airQualityRelatedEnabled = isEnabled(control.getAirCleaner());
        boolean fireRelatedEnabled =
                isEnabled(control.getFireAlarm()) ||
                isEnabled(control.getSprinkler());

        return AnalysisRequestDto.builder()
                .macAddress(mac)
                .indoor(AnalysisRequestDto.Indoor.builder()
                        .temperature(tempRelatedEnabled ? toDouble(sensor.getTemperature()) : null)
                        .humidity(humidityRelatedEnabled ? toDouble(sensor.getHumidity()) : null)
                        .pressure(tempRelatedEnabled ? toDouble(sensor.getPressure()) : null)
                        .tvoc(airQualityRelatedEnabled ? sensor.getTvoc() : null)
                        .eco2(airQualityRelatedEnabled ? sensor.getEco2() : null)
                        .flame(fireRelatedEnabled ? sensor.getFlameValue() : null)
                        .build())
                .outdoor(AnalysisRequestDto.Outdoor.builder()
                        .ta(weather != null ? weather.getTempTa() : null)
                        .wd(weather != null ? weather.getWindDirWd() : null)
                        .ws(weather != null ? weather.getWindSpeedWs() : null)
                        .hm(weather != null ? weather.getHumidityHm() : null)
                        .rn(weather != null ? weather.getPrecipitationRn() : null)
                        .isSW(weather != null && weather.getIsStrongWindWarning() != null && weather.getIsStrongWindWarning() > 0)
                        .isDW(weather != null && weather.getIsDryWarning() != null && weather.getIsDryWarning() > 0)
                        .build())
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
                        .north_window(control.getNorthWindow())
                        .south_window(control.getSouthWindow())
                        .east_window(control.getEastWindow())
                        .west_window(control.getWestWindow())
                        .air_conditioner(control.getAirConditioner())
                        .heating(control.getHeating())
                        .humidifier(control.getHumidifier())
                        .dehumidifier(control.getDehumidifier())
                        .air_cleaner(control.getAirCleaner())
                        .sprinkler(control.getSprinkler())
                        .fire_alarm(control.getFireAlarm())
                        .build())
                .alert(AnalysisRequestDto.Alert.builder()
                        .category("MANUAL_REFRESH")
                        .severity("NORMAL")
                        .build())
                .build();
    }

    private Double toDouble(BigDecimal value) {
        return value == null ? null : value.doubleValue();
    }

    private boolean isEnabled(Boolean value) {
        return Boolean.TRUE.equals(value);
    }

    private Map<String, Object> messageBody(String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", message);
        return body;
    }
}
