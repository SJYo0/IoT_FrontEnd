package com.iot_sw.iot_web_backend.dashboard.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.iot_sw.iot_web_backend.dashboard.entity.WeatherData;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface WeatherRepository extends JpaRepository<WeatherData, Long> {

    boolean existsByCreatedAtAndLocationCode(LocalDateTime createdAt, Integer locationCode);

    Optional<WeatherData> findTopByOrderByCreatedAtDesc();

    @Query("SELECT " +
            "MIN(w.tempTa) as minTemp, MAX(w.tempTa) as maxTemp, AVG(w.tempTa) as avgTemp, " +
            "MIN(w.windSpeedWs) as minWind, MAX(w.windSpeedWs) as maxWind, AVG(w.windSpeedWs) as avgWind, " +
            "MIN(w.humidityHm) as minHum, MAX(w.humidityHm) as maxHum, AVG(w.humidityHm) as avgHum, " +
            "MIN(w.precipitationRn) as minRain, MAX(w.precipitationRn) as maxRain, AVG(w.precipitationRn) as avgRain, " +
            "MAX(w.isStrongWindWarning) as strongWindWarn, MAX(w.isDryWarning) as dryWarn " +
            "FROM WeatherData w " +
            "WHERE w.locationCode = :locCode AND w.createdAt >= :start AND w.createdAt <= :end")
    WeatherAggProjection getDailyAggregation(@Param("locCode") Integer locCode, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    public interface WeatherAggProjection {
        Double getMinTemp(); Double getMaxTemp(); Double getAvgTemp();
        Double getMinWind(); Double getMaxWind(); Double getAvgWind();
        Double getMinHum(); Double getMaxHum(); Double getAvgHum();
        Double getMinRain(); Double getMaxRain(); Double getAvgRain();
        Byte getStrongWindWarn(); Byte getDryWarn(); // 1이면 발효, 0이면 해제
    }
}