package com.iot_sw.iot_web_backend.setting.dto;

public record DeviceControlStateDto(
        Boolean windowNorth,
        Boolean windowSouth,
        Boolean windowEast,
        Boolean windowWest,
        Boolean aircon,
        Boolean heater,
        Boolean humidifier,
        Boolean dehumidifier,
        Boolean airCleaner,
        Boolean sprinkler,
        Boolean fireAlarm
) {
}
