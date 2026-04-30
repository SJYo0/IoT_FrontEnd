package com.iot_sw.iot_web_backend.device.controller;

import com.iot_sw.iot_web_backend.device.entity.AlertLog;
import com.iot_sw.iot_web_backend.device.repository.AlertLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertLogRepository alertLogRepository;

    @GetMapping("/active/{mac}")
    public ResponseEntity<List<AlertLog>> getActiveAlerts(@PathVariable String mac) {
        // 특정 라즈베리파이 기기에서 현재 울리고 있는 알람들만 반환
        List<AlertLog> activeAlerts = alertLogRepository.findActiveAlertsByMac(mac);
        return ResponseEntity.ok(activeAlerts);
    }
}
