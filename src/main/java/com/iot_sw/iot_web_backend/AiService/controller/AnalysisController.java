//package com.iot_sw.iot_web_backend.AiService.controller;
//
//import com.iot_sw.iot_web_backend.AiService.service.AnalysisService;
//import com.iot_sw.iot_web_backend.device.component.DeviceIdCache;
//import com.iot_sw.iot_web_backend.device.dto.request.SensorDataDTO;
//import com.iot_sw.iot_web_backend.device.repository.DeviceRepository;
//import lombok.RequiredArgsConstructor;
//import lombok.extern.slf4j.Slf4j;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.*;
//
//@Slf4j
//@RestController
//@RequestMapping("/api/ai")
//@RequiredArgsConstructor
//public class AnalysisController {
//    private final AnalysisService analysisService;
//    private final DeviceIdCache deviceIdCache;
//    // 최신 센서 데이터를 가져오기 위해 필요 (기존에 구현된 센서 저장소/서비스를 주입)
//    // private final SensorDataService sensorDataService;
//
//    /**
//     * 사용자에 의한 수동 AI 분석 요청
//     * @param macAddress 분석할 기기의 MAC 주소
//     */
//    @PostMapping("/analyze/{macAddress}")
//    public ResponseEntity<String> triggerManualAnalysis(@PathVariable String macAddress) {
//        log.info("[API] 수동 AI 분석 요청 수신 - MAC: {}", macAddress);
//
//        // 1. 캐시에서 기기 ID 확인
//        Long deviceId = deviceIdCache.getDeviceId(macAddress);
//        if (deviceId == null) {
//            return ResponseEntity.badRequest().body("미등록 기기입니다.");
//        }
//
//        // 2. 가장 최근의 센서 데이터 가져오기
//        // (주의: DB나 Redis 등에 저장된 최신 SensorDataDTO를 긁어오는 로직이 필요합니다)
//        // SensorDataDTO latestSensorData = sensorDataService.getLatestData(macAddress);
//
//        // if (latestSensorData == null) {
//        //    return ResponseEntity.status(404).body("분석할 최근 센서 데이터가 존재하지 않습니다.");
//        // }
//
//        // 3. AI 분석 요청 실행
//        // (기존 AlertService에 있던 buildAndRequestAiAnalysis 로직을 AnalysisService로 공통화하여 호출하는 것을 권장합니다)
//        // analysisService.executeFullAnalysis(deviceId, macAddress, "MANUAL", "NORMAL", latestSensorData);
//
//        return ResponseEntity.accepted().body("AI 분석 요청이 성공적으로 접수되었습니다.");
//    }
//}
