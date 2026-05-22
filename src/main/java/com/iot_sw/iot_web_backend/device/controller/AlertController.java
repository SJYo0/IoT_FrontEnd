package com.iot_sw.iot_web_backend.device.controller;

import com.iot_sw.iot_web_backend.device.entity.AlertLog;
import com.iot_sw.iot_web_backend.device.enums.AlertCategory;
import com.iot_sw.iot_web_backend.device.repository.AlertLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;
import java.util.Map;

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

    @PatchMapping("/read/{mac}")
    public ResponseEntity<Map<String, Object>> markAllRead(@PathVariable String mac) {
        int updated = alertLogRepository.markAllUnreadByMacAsRead(normalizeMac(mac));
        return ResponseEntity.ok(Map.of("updatedCount", updated));
    }

    @PatchMapping("/read/{mac}/category")
    public ResponseEntity<Map<String, Object>> markCategoryRead(
            @PathVariable String mac,
            @RequestParam String category
    ) {
        AlertCategory parsedCategory;
        try {
            parsedCategory = AlertCategory.valueOf(String.valueOf(category).trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("message", "유효하지 않은 알림 카테고리입니다."));
        }

        int updated = alertLogRepository.markUnreadByMacAndCategoryAsRead(normalizeMac(mac), parsedCategory);
        return ResponseEntity.ok(Map.of("updatedCount", updated));
    }

    private String normalizeMac(String mac) {
        return String.valueOf(mac).trim().toUpperCase(Locale.ROOT);
    }
}
