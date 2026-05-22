package com.iot_sw.iot_web_backend.device.repository;

import com.iot_sw.iot_web_backend.device.entity.SensorTelemetry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface SensorRepository extends JpaRepository<SensorTelemetry, Long> {
    @Query("SELECT " +
            "MIN(s.temperature) as minTemp, MAX(s.temperature) as maxTemp, AVG(s.temperature) as avgTemp, " +
            "MIN(s.humidity) as minHum, MAX(s.humidity) as maxHum, AVG(s.humidity) as avgHum, " +
            "MIN(s.pressure) as minPres, MAX(s.pressure) as maxPres, AVG(s.pressure) as avgPres, " +
            "MIN(s.tvoc) as minTvoc, MAX(s.tvoc) as maxTvoc, AVG(s.tvoc) as avgTvoc, " +
            "MIN(s.eco2) as minEco2, MAX(s.eco2) as maxEco2, AVG(s.eco2) as avgEco2 " +
            "FROM SensorTelemetry s " +
            "WHERE s.device.id = :deviceId AND s.measuredAt >= :start AND s.measuredAt <= :end")
    SensorAggProjection getDailyAggregation(@Param("deviceId") Long deviceId, @Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    interface SensorAggProjection {
        Double getMinTemp(); Double getMaxTemp(); Double getAvgTemp();
        Double getMinHum(); Double getMaxHum(); Double getAvgHum();
        Double getMinPres(); Double getMaxPres(); Double getAvgPres();
        Integer getMinTvoc(); Integer getMaxTvoc(); Double getAvgTvoc();
        Integer getMinEco2(); Integer getMaxEco2(); Double getAvgEco2();
    }
}