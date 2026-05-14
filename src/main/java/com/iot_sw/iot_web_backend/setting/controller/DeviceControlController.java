package com.iot_sw.iot_web_backend.setting.controller;

import com.iot_sw.iot_web_backend.setting.dto.DeviceControlStateDto;
import com.iot_sw.iot_web_backend.setting.service.DeviceControlService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/control")
@RequiredArgsConstructor
public class DeviceControlController {

    private final DeviceControlService deviceControlService;

    @GetMapping("/environment")
    public DeviceControlStateDto getEnvironment(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "") String mac
    ) {
        return deviceControlService.getEnvironmentState(authentication.getName(), mac);
    }

    @PutMapping("/environment")
    public DeviceControlStateDto saveEnvironment(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "") String mac,
            @RequestBody DeviceControlStateDto request
    ) {
        return deviceControlService.saveEnvironmentState(authentication.getName(), mac, request);
    }

    @GetMapping("/status")
    public DeviceControlStateDto getControlStatus(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "") String mac
    ) {
        return deviceControlService.getControlStatusState(authentication.getName(), mac);
    }

    @PutMapping("/status")
    public DeviceControlStateDto saveControlStatus(
            Authentication authentication,
            @RequestParam(required = false, defaultValue = "") String mac,
            @RequestBody DeviceControlStateDto request
    ) {
        return deviceControlService.saveControlStatusState(authentication.getName(), mac, request);
    }

    @org.springframework.web.bind.annotation.ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(Map.of("message", ex.getMessage()));
    }
}
