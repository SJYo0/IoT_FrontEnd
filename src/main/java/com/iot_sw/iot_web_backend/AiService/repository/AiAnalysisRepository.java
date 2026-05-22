package com.iot_sw.iot_web_backend.AiService.repository;

import com.iot_sw.iot_web_backend.AiService.entity.AiAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AiAnalysisRepository extends JpaRepository<AiAnalysis, Long> {
    List<AiAnalysis> findByDeviceIdOrderByCreatedAtDesc(Long deviceId);

    Optional<AiAnalysis> findTopByDevice_MacIdOrderByCreatedAtDesc(String macId);

    Optional<AiAnalysis> findTopByOrderByCreatedAtDesc();
}
