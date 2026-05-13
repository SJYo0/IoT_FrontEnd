CREATE TABLE sensor_telemetry
(
    id          BIGINT AUTO_INCREMENT NOT NULL COMMENT '센서 데이터 고유 ID',
    device_id   BIGINT                NOT NULL COMMENT '대상 기기 ID',
    temperature DECIMAL(5, 2)         NULL COMMENT '온도',
    humidity    DECIMAL(5, 2)         NULL COMMENT '습도',
    pressure    DECIMAL(6, 2)         NULL COMMENT '기압 (hPa)',
    tvoc        SMALLINT UNSIGNED     NULL COMMENT '총 휘발성 유기화합물',
    eco2        SMALLINT UNSIGNED     NULL COMMENT '이산화탄소 환산값',
    flame_value SMALLINT              NULL COMMENT '화염 센서 아날로그 값',
    measured_at DATETIME(3)           NOT NULL COMMENT '센서 측정 시간',

    CONSTRAINT pk_sensor_telemetry PRIMARY KEY (id),

    CONSTRAINT fk_sensor_telemetry_device FOREIGN KEY (device_id) REFERENCES device (id) ON DELETE CASCADE,
    INDEX idx_device_measured (device_id, measured_at)
);