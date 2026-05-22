package com.iot_sw.iot_web_backend.AiService.service;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.iot_sw.iot_web_backend.AiService.dto.request.AiReportInputDto;
import com.iot_sw.iot_web_backend.AiService.dto.response.AiReportOutputDto;
import com.iot_sw.iot_web_backend.AiService.entity.AiReport;
import com.iot_sw.iot_web_backend.AiService.repository.AiReportRepository;
import com.iot_sw.iot_web_backend.device.entity.Device;
import com.iot_sw.iot_web_backend.device.repository.DeviceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class AiReportGenerateService {

    private final WebClient webClient;
    private final ObjectMapper objectMapper;
    private final AiReportService aiReportService;
    private final DeviceRepository deviceRepository;
    private final AiReportRepository aiReportRepository;

    public AiReportGenerateService(
            @Value("${llm.server.url}") String llmServerUrl,
            ObjectMapper objectMapper,
            AiReportService aiReportService,
            DeviceRepository deviceRepository,
            AiReportRepository aiReportRepository) {

        this.webClient = WebClient.builder().baseUrl(llmServerUrl).build();
        this.objectMapper = objectMapper;
        this.aiReportService = aiReportService;
        this.deviceRepository = deviceRepository;
        this.aiReportRepository = aiReportRepository;
    }

    // 매일 새벽 1시 자동 실행
    @Scheduled(cron = "0 0 1 * * *", zone = "Asia/Seoul")
    @Transactional
    public void generateDailyReports() {
        // 어제 날짜를 기준으로 데이터 집계
        LocalDateTime targetDate = LocalDateTime.now().minusDays(1);
        log.info("[AI Report Batch] {} 일자 리포트 자동 생성 배치를 시작합니다.", targetDate.toLocalDate());

        // 등록된 모든 기기 목록 조회
        List<Device> devices = deviceRepository.findAll();

        for (Device device : devices) {
            try {
                Integer locationCode = 108; // 서울

                // Input DTO 생성
                AiReportInputDto inputDto = aiReportService.buildDailyReportInput(device.getId(), locationCode, targetDate);

                // 센서 데이터가 전혀 없는 경우 스킵
                if (inputDto.getSensor_summary() == null) {
                    log.warn("[AI] Device ID: {} - 센서 데이터 부재", device.getId());
                    continue;
                }

                // AI 리포트 생성
                log.info("[AI] Device ID: {} - 리포트 생성 요청", device.getId());
                AiReportOutputDto responseDto = webClient.post()
                        .uri("/api/v1/report")
                        .contentType(MediaType.APPLICATION_JSON)
                        .bodyValue(inputDto)
                        .retrieve()
                        .bodyToMono(AiReportOutputDto.class)
                        .block();

                // DB 저장
                if (responseDto != null) {
                    // JSON 변환
                    Map<String, Object> inputDataMap = objectMapper.convertValue(inputDto, Map.class);
                    Map<String, Object> resultMap = objectMapper.convertValue(responseDto, Map.class);

                    AiReport aiReport = AiReport.builder()
                            .device(device)
                            .inputData(inputDataMap)
                            .result(resultMap)
                            .build();

                    aiReportRepository.save(aiReport);
                    log.info("[AI] Device ID: {} - 리포트 저장 성공", device.getId());
                }

            } catch (org.springframework.web.reactive.function.client.WebClientResponseException e) {
                log.error("[AI] {}", e.getResponseBodyAsString());
            } catch (Exception e) {
                log.error("[AI] Device ID: {} - {}", device.getId(), e.getMessage());
            }
        }

        log.info("[AI] 리포트 생성 완료");
    }
}