package com.iot_sw.iot_web_backend.history.controller;

import com.iot_sw.iot_web_backend.dashboard.entity.WeatherData;
import com.iot_sw.iot_web_backend.dashboard.repository.WeatherRepository;
import com.iot_sw.iot_web_backend.device.entity.SensorTelemetry;
import com.iot_sw.iot_web_backend.device.repository.SensorRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.YearMonth;
import java.time.format.DateTimeFormatter;
import java.time.temporal.WeekFields;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/history")
@RequiredArgsConstructor
public class HistoryController {

    private final SensorRepository sensorRepository;
    private final WeatherRepository weatherRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getHistory(
            @RequestParam(defaultValue = "daily") String period,
            @RequestParam(required = false) String mac,
            @RequestParam(required = false) String date,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate,
            @RequestParam(required = false) String month
    ) {
        String normalizedPeriod = normalizePeriod(period);
        Range range = resolveRange(normalizedPeriod, date, startDate, endDate, month);

        List<SensorTelemetry> sensors = hasText(mac)
                ? sensorRepository.findByDevice_MacIdAndMeasuredAtBetweenOrderByMeasuredAtAsc(mac.trim(), range.start(), range.end())
                : sensorRepository.findByMeasuredAtBetweenOrderByMeasuredAtAsc(range.start(), range.end());
        List<WeatherData> weathers = weatherRepository.findByCreatedAtBetweenOrderByCreatedAtAsc(range.start(), range.end());

        Map<Integer, Bucket> buckets = createHourlyBuckets();

        for (SensorTelemetry sensor : sensors) {
            if (sensor.getMeasuredAt() == null) continue;
            int hour = sensor.getMeasuredAt().getHour();
            Bucket bucket = buckets.get(hour);
            bucket.addSensor(sensor);
        }

        for (WeatherData weather : weathers) {
            if (weather.getCreatedAt() == null) continue;
            int hour = weather.getCreatedAt().getHour();
            Bucket bucket = buckets.get(hour);
            bucket.addWeather(weather);
        }

        List<Map<String, Object>> points = new ArrayList<>();
        for (Bucket bucket : buckets.values()) {
            points.add(bucket.toPoint());
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("baseDate", range.baseDate().toString());
        body.put("rangeStartDate", range.start().toLocalDate().toString());
        body.put("rangeEndDate", range.end().toLocalDate().toString());
        body.put("points", points);
        return ResponseEntity.ok(body);
    }

    private String normalizePeriod(String period) {
        if (!hasText(period)) return "daily";
        String value = period.trim().toLowerCase(Locale.ROOT);
        if (!value.equals("daily") && !value.equals("weekly") && !value.equals("monthly")) {
            return "daily";
        }
        return value;
    }

    private Range resolveRange(String period, String date, String startDate, String endDate, String month) {
        if (period.equals("weekly")) {
            LocalDate start = hasText(startDate) ? LocalDate.parse(startDate.trim()) : mondayOf(LocalDate.now());
            LocalDate endExclusive = hasText(endDate) ? LocalDate.parse(endDate.trim()) : start.plusDays(7);
            if (!endExclusive.isAfter(start)) {
                endExclusive = start.plusDays(7);
            }
            return new Range(start, start.atStartOfDay(), endExclusive.atStartOfDay().minusNanos(1));
        }

        if (period.equals("monthly")) {
            YearMonth ym = hasText(month) ? YearMonth.parse(month.trim()) : YearMonth.from(LocalDate.now());
            LocalDate start = ym.atDay(1);
            LocalDate end = ym.atEndOfMonth();
            return new Range(start, start.atStartOfDay(), end.atTime(LocalTime.MAX));
        }

        LocalDate target = hasText(date) ? LocalDate.parse(date.trim()) : LocalDate.now();
        return new Range(target, target.atStartOfDay(), target.atTime(LocalTime.MAX));
    }

    private LocalDate mondayOf(LocalDate date) {
        return date.with(WeekFields.ISO.dayOfWeek(), DayOfWeek.MONDAY.getValue());
    }

    private Map<Integer, Bucket> createHourlyBuckets() {
        Map<Integer, Bucket> buckets = new LinkedHashMap<>();
        for (int hour = 0; hour < 24; hour++) {
            buckets.put(hour, new Bucket(labelForHour(hour)));
        }
        return buckets;
    }

    private String labelForHour(int hour) {
        return String.format("%02d:00", hour);
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private record Range(LocalDate baseDate, LocalDateTime start, LocalDateTime end) {
    }

    private static class Bucket {
        private final String label;

        private double indoorTempSum;
        private int indoorTempCount;
        private double indoorHumiditySum;
        private int indoorHumidityCount;
        private double indoorPressureSum;
        private int indoorPressureCount;
        private long indoorTvocSum;
        private int indoorTvocCount;
        private long indoorEco2Sum;
        private int indoorEco2Count;
        private long indoorFlameSum;
        private int indoorFlameCount;

        private double outdoorTempSum;
        private int outdoorTempCount;
        private double wdSum;
        private int wdCount;
        private double wsSum;
        private int wsCount;
        private double outdoorHumiditySum;
        private int outdoorHumidityCount;
        private double rnSum;
        private int rnCount;

        Bucket(String label) {
            this.label = label;
        }

        void addSensor(SensorTelemetry sensor) {
            addDouble(sensor.getTemperature(), value -> {
                indoorTempSum += value;
                indoorTempCount++;
            });
            addDouble(sensor.getHumidity(), value -> {
                indoorHumiditySum += value;
                indoorHumidityCount++;
            });
            addDouble(sensor.getPressure(), value -> {
                indoorPressureSum += value;
                indoorPressureCount++;
            });
            addInteger(sensor.getTvoc(), value -> {
                indoorTvocSum += value;
                indoorTvocCount++;
            });
            addInteger(sensor.getEco2(), value -> {
                indoorEco2Sum += value;
                indoorEco2Count++;
            });
            addInteger(sensor.getFlameValue(), value -> {
                indoorFlameSum += value;
                indoorFlameCount++;
            });
        }

        void addWeather(WeatherData weather) {
            addDouble(weather.getTempTa(), value -> {
                outdoorTempSum += value;
                outdoorTempCount++;
            });
            addDouble(weather.getWindDirWd(), value -> {
                wdSum += value;
                wdCount++;
            });
            addDouble(weather.getWindSpeedWs(), value -> {
                wsSum += value;
                wsCount++;
            });
            addDouble(weather.getHumidityHm(), value -> {
                outdoorHumiditySum += value;
                outdoorHumidityCount++;
            });
            addDouble(weather.getPrecipitationRn(), value -> {
                rnSum += value;
                rnCount++;
            });
        }

        Map<String, Object> toPoint() {
            Map<String, Object> point = new LinkedHashMap<>();
            point.put("label", label);
            point.put("indoorTemp", average(indoorTempSum, indoorTempCount));
            point.put("indoorHumidity", average(indoorHumiditySum, indoorHumidityCount));
            point.put("indoorPressure", average(indoorPressureSum, indoorPressureCount));
            point.put("indoorTvoc", averageInt(indoorTvocSum, indoorTvocCount));
            point.put("indoorEco2", averageInt(indoorEco2Sum, indoorEco2Count));
            point.put("indoorFlame", averageInt(indoorFlameSum, indoorFlameCount));
            point.put("outdoorTemp", average(outdoorTempSum, outdoorTempCount));
            point.put("wd", average(wdSum, wdCount));
            point.put("ws", average(wsSum, wsCount));
            point.put("outdoorHumidity", average(outdoorHumiditySum, outdoorHumidityCount));
            point.put("rn", average(rnSum, rnCount));
            return point;
        }

        private Double average(double sum, int count) {
            if (count == 0) return null;
            return sum / count;
        }

        private Integer averageInt(long sum, int count) {
            if (count == 0) return null;
            return (int) Math.round((double) sum / count);
        }

        private void addDouble(Number value, DoubleConsumer consumer) {
            if (value == null) return;
            consumer.accept(value.doubleValue());
        }

        private void addInteger(Integer value, IntConsumer consumer) {
            if (value == null) return;
            consumer.accept(value);
        }

        @FunctionalInterface
        private interface DoubleConsumer {
            void accept(double value);
        }

        @FunctionalInterface
        private interface IntConsumer {
            void accept(int value);
        }
    }
}
