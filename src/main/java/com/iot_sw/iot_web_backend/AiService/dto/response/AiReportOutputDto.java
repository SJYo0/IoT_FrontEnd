package com.iot_sw.iot_web_backend.AiService.dto.response;

import lombok.Data;
import java.util.List;

@Data
public class AiReportOutputDto {
    private String total_report;
    private List<AlarmKeyNote> alarm_key_notes;
    private ControlKeyNotes control_key_notes;

    @Data
    public static class AlarmKeyNote {
        private String title;
        private String content;
    }

    @Data
    public static class ControlKeyNotes {
        private ApplianceStat air_conditioner;
        private ApplianceStat heating;
        private ApplianceStat humidifier;
        private ApplianceStat dehumidifier;
        private ApplianceStat air_cleaner;
        private Double used_energy;
        private String comment;
    }

    @Data
    public static class ApplianceStat {
        private int count;
        private int runtime;
    }
}
