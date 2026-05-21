package com.iot_sw.iot_web_backend.device.repository;

import com.iot_sw.iot_web_backend.device.entity.SensorTelemetry;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SensorRepository extends JpaRepository<SensorTelemetry, Long> {
    List<SensorTelemetry> findByDevice_MacIdAndMeasuredAtBetweenOrderByMeasuredAtAsc(String macId, LocalDateTime start, LocalDateTime end);

    List<SensorTelemetry> findByMeasuredAtBetweenOrderByMeasuredAtAsc(LocalDateTime start, LocalDateTime end);

    Optional<SensorTelemetry> findTopByDevice_MacIdOrderByMeasuredAtDesc(String macId);
}