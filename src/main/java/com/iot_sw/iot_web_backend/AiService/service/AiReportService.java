package com.iot_sw.iot_web_backend.AiService.service;

import com.iot_sw.iot_web_backend.AiService.dto.request.AiReportInputDto;
import com.iot_sw.iot_web_backend.dashboard.repository.WeatherRepository;
import com.iot_sw.iot_web_backend.device.entity.AlertLog;
import com.iot_sw.iot_web_backend.device.repository.AlertLogRepository;
import com.iot_sw.iot_web_backend.device.repository.SensorRepository;
import com.iot_sw.iot_web_backend.setting.entity.ControlLog;
import com.iot_sw.iot_web_backend.setting.repository.ControlLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiReportService {

    private final SensorRepository sensorRepository;
    private final WeatherRepository weatherRepository;
    private final AlertLogRepository alertLogRepository;
    private final ControlLogRepository controlLogRepository;

    private static final DateTimeFormatter TIME_FORMATTER = DateTimeFormatter.ofPattern("HH:mm:ss");

    // DB 조회 후 Input DTO 조립 함수
    public AiReportInputDto buildDailyReportInput(Long deviceId, Integer locationCode, LocalDateTime targetDate) {

        LocalDateTime startOfDay = targetDate.withHour(0).withMinute(0).withSecond(0).withNano(0);
        LocalDateTime endOfDay = targetDate.withHour(23).withMinute(59).withSecond(59).withNano(999999999);

        LocalDateTime endOfWorkHours = targetDate.withHour(18).withMinute(0).withSecond(0).withNano(0);

        log.info("[AI] {} 데이터 조립 시작 (Device: {})", startOfDay.toLocalDate(), deviceId);

        return AiReportInputDto.builder()
                .date(startOfDay.toLocalDate().toString())
                .sensor_summary(buildSensorSummary(deviceId, startOfDay, endOfDay))
                .weather_summary(buildWeatherSummary(locationCode, startOfDay, endOfDay))
                .alarms(buildAlarmSummary(deviceId, startOfDay, endOfDay))
                .controls(buildControlSummary(deviceId, startOfDay, endOfWorkHours))
                .build();
    }

    // 실내 센서 데이터
    private AiReportInputDto.SensorSummary buildSensorSummary(Long deviceId, LocalDateTime start, LocalDateTime end) {
        SensorRepository.SensorAggProjection agg = sensorRepository.getDailyAggregation(deviceId, start, end);
        if (agg == null || agg.getAvgTemp() == null) return null; // 데이터가 없는 경우

        return AiReportInputDto.SensorSummary.builder()
                .temperature(new AiReportInputDto.MinMaxAvg(agg.getMinTemp(), agg.getMaxTemp(), agg.getAvgTemp()))
                .humidity(new AiReportInputDto.MinMaxAvg(agg.getMinHum(), agg.getMaxHum(), agg.getAvgHum()))
                .pressure(new AiReportInputDto.MinMaxAvg(agg.getMinPres(), agg.getMaxPres(), agg.getAvgPres()))
                .tvoc(new AiReportInputDto.MinMaxAvg(agg.getMinTvoc(), agg.getMaxTvoc(), agg.getAvgTvoc()))
                .eco2(new AiReportInputDto.MinMaxAvg(agg.getMinEco2(), agg.getMaxEco2(), agg.getAvgEco2()))
                .build();
    }

    // 실외 날씨 데이터
    private AiReportInputDto.WeatherSummary buildWeatherSummary(Integer locCode, LocalDateTime start, LocalDateTime end) {
        WeatherRepository.WeatherAggProjection agg = weatherRepository.getDailyAggregation(locCode, start, end);
        if (agg == null || agg.getAvgTemp() == null) return null;

        return AiReportInputDto.WeatherSummary.builder()
                .temp_ta(new AiReportInputDto.MinMaxAvg(agg.getMinTemp(), agg.getMaxTemp(), agg.getAvgTemp()))
                .wind_speed_ws(new AiReportInputDto.MinMaxAvg(agg.getMinWind(), agg.getMaxWind(), agg.getAvgWind()))
                .humidity_hm(new AiReportInputDto.MinMaxAvg(agg.getMinHum(), agg.getMaxHum(), agg.getAvgHum()))
                .precipitation_rn(new AiReportInputDto.MinMaxAvg(agg.getMinRain(), agg.getMaxRain(), agg.getAvgRain()))
                .is_strong_wind_warning(agg.getStrongWindWarn() != null && agg.getStrongWindWarn() == 1)
                .is_dry_warning(agg.getDryWarn() != null && agg.getDryWarn() == 1)
                .build();
    }

    // 알람 내역 (최대 20건 제한)
    private List<AiReportInputDto.AlarmInfo> buildAlarmSummary(Long deviceId, LocalDateTime start, LocalDateTime end) {
        List<AlertLog> alerts = alertLogRepository.findDailyAlerts(deviceId, start, end);
        return alerts.stream().limit(20).map(alert -> AiReportInputDto.AlarmInfo.builder()
                .start_time(alert.getCreatedAt().format(TIME_FORMATTER))
                .end_time(alert.getResolvedAt() != null ? alert.getResolvedAt().format(TIME_FORMATTER) : "Not Resolved")
                .category(alert.getCategory().name())
                .severity(alert.getSeverity().name())
                .build()
        ).collect(Collectors.toList());
    }

    // 인프라 제어
    private Map<String, AiReportInputDto.ControlSummary> buildControlSummary(Long deviceId, LocalDateTime start, LocalDateTime endOfWorkHours) {
        // 오후 6시까지만 측정
        List<ControlLog> logs = controlLogRepository.findDailyLogs(deviceId, start, endOfWorkHours);
        String[] targetAppliances = {"air_conditioner", "heating", "humidifier", "dehumidifier", "air_cleaner"};

        Map<String, AiReportInputDto.ControlSummary> summaryMap = new HashMap<>();
        Map<String, LocalDateTime> lastOnTimeMap = new HashMap<>();

        for (String appliance : targetAppliances) {
            summaryMap.put(appliance, AiReportInputDto.ControlSummary.builder().count(0).runtime(0).build());
        }

        for (ControlLog log : logs) {
            Map<String, Object> newStatus = log.getNewStatus();
            LocalDateTime logTime = log.getCreatedAt();

            for (String appliance : targetAppliances) {
                if (newStatus.containsKey(appliance)) {
                    boolean isOn = (Boolean) newStatus.get(appliance);
                    AiReportInputDto.ControlSummary summary = summaryMap.get(appliance);

                    if (isOn) {
                        summary.setCount(summary.getCount() + 1);
                        lastOnTimeMap.put(appliance, logTime);
                    } else {
                        if (lastOnTimeMap.containsKey(appliance)) {
                            long minutes = Duration.between(lastOnTimeMap.get(appliance), logTime).toMinutes();
                            summary.setRuntime(summary.getRuntime() + (int) minutes);
                            lastOnTimeMap.remove(appliance);
                        }
                    }
                }
            }
        }

        // 퇴근까지 꺼지지 않은 인프라 계산
        for (String appliance : targetAppliances) {
            if (lastOnTimeMap.containsKey(appliance)) {
                long minutes = Duration.between(lastOnTimeMap.get(appliance), endOfWorkHours).toMinutes();
                if (minutes > 0) {
                    AiReportInputDto.ControlSummary summary = summaryMap.get(appliance);
                    summary.setRuntime(summary.getRuntime() + (int) minutes);
                }
            }
        }

        return summaryMap;
    }
}