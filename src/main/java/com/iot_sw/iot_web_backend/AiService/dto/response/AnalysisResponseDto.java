package com.iot_sw.iot_web_backend.AiService.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Data;
import java.util.List;

@Data
public class AnalysisResponseDto {
    private String macAddress;
    private Status status;
    private Summary summary;
    private Control control;

    @Data
    public static class Status {
        private Integer score;
        private String severity;
    }

    @Data
    public static class Summary {
        private List<String> comment;
        private List<String> control_sum;
        private List<String> todo;
    }

    @Data
    @JsonInclude(JsonInclude.Include.NON_NULL)
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
}
