package com.iot_sw.iot_web_backend.AiService.dto.request;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL) // null인 값은 JSON에서 제외
public class AiReportInputDto {
    private String date;
    private SensorSummary sensor_summary;
    private WeatherSummary weather_summary;
    private List<AlarmInfo> alarms;
    private Map<String, ControlSummary> controls;

    @Data
    @Builder
    public static class SensorSummary {
        private MinMaxAvg temperature;
        private MinMaxAvg humidity;
        private MinMaxAvg pressure;
        private MinMaxAvg tvoc;
        private MinMaxAvg eco2;
    }

    @Data
    @Builder
    public static class WeatherSummary {
        private MinMaxAvg temp_ta;
        private MinMaxAvg wind_speed_ws;
        private MinMaxAvg humidity_hm;
        private MinMaxAvg precipitation_rn;
        @JsonProperty("is_strong_wind_warning")
        private boolean is_strong_wind_warning;
        @JsonProperty("is_dry_warning")
        private boolean is_dry_warning;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MinMaxAvg {
        private Number min;
        private Number max;
        private Number avg;
    }

    @Data
    @Builder
    public static class AlarmInfo {
        private String start_time;
        private String end_time;
        private String category;
        private String severity;
    }

    @Data
    @Builder
    public static class ControlSummary {
        private int count;
        private int runtime; // 분(minute) 단위
    }
}