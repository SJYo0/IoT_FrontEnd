package com.iot_sw.iot_web_backend.dashboard.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.iot_sw.iot_web_backend.dashboard.entity.WeatherData;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WeatherRepository extends JpaRepository<WeatherData, Long> {

    boolean existsByCreatedAtAndLocationCode(LocalDateTime createdAt, Integer locationCode);

    Optional<WeatherData> findTopByOrderByCreatedAtDesc();

    List<WeatherData> findByCreatedAtBetweenOrderByCreatedAtAsc(LocalDateTime start, LocalDateTime end);
}