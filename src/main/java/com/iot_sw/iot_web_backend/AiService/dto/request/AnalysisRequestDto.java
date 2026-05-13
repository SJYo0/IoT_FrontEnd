package com.iot_sw.iot_web_backend.AiService.dto.request;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AnalysisRequestDto {
    private String macAddress;
    private Indoor indoor;
    private Outdoor outdoor;
    private Setting setting;
    private Control control;
    private Alert alert;

    @Data @Builder
    public static class Indoor {
        private Double temperature;
        private Double humidity;
        private Double pressure;
        private Integer tvoc;
        private Integer eco2;
        private Integer flame;
    }

    @Data @Builder
    public static class Outdoor {
        private Double ta;
        private Double wd;
        private Double ws;
        private Double hm;
        private Double rn;
        private Boolean isSW;
        private Boolean isDW;
    }

    @Data @Builder
    public static class Setting {
        private Boolean north_window;
        private Boolean south_window;
        private Boolean east_window;
        private Boolean west_window;
        private Boolean air_conditioner;
        private Boolean heating;
        private Boolean humidifier;
        private Boolean dehumidifier;
        private Boolean air_cleaner;
        private Boolean sprinkler;
        private Boolean fire_alarm;
    }

    @Data @Builder
    public static class Control {
        private Boolean north_window;
        private Boolean south_window;
        private Boolean east_window;
        private Boolean west_window;
        private Boolean air_conditioner;
        private Boolean heating;
        private Boolean humidifier;
        private Boolean dehumidifier;
        private Boolean air_cleaner;
        private Boolean sprinkler;
        private Boolean fire_alarm;
    }

    @Data @Builder
    public static class Alert {
        private String category;
        private String severity;
    }
}
